"""
Fetch ALL Finnish libraries from Kirjastot.fi API and populate database.
Official source: https://api.kirjastot.fi/v4/library

This script:
1. Fetches all Finnish libraries from the official API
2. Extracts coordinates, addresses, names, and metadata
3. Geocodes libraries without coordinates using OpenStreetMap Nominatim
4. Populates PostgreSQL database
5. Supports incremental updates (doesn't duplicate)

Usage:
    cd backend
    python scripts/fetch_kirjastot_fi.py
"""
import os
import sys
import asyncio
import logging
from pathlib import Path
from typing import Optional, Dict, Any

import httpx

# Add backend directory to Python path
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

# Set default environment variables if not set
os.environ.setdefault(
    'KIRJASTO_DATABASE_URL',
    'postgresql+psycopg://kirjastokaveri:kirjastokaveri@localhost:5434/kirjastokaveri'
)
os.environ.setdefault('KIRJASTO_CORS_ALLOW_ORIGINS', '["http://localhost:5173"]')
os.environ.setdefault('KIRJASTO_FINNA_BASE_URL', 'https://api.finna.fi')
os.environ.setdefault('KIRJASTO_FINNA_SEARCH_ENDPOINT', '/api/v1/search')

from sqlalchemy import create_engine, select
from sqlalchemy.orm import sessionmaker, Session
from app.models.library import Library
from app.core.config import get_settings

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# API Configuration
KIRJASTOT_API_BASE = "https://api.kirjastot.fi/v4"
NOMINATIM_API_BASE = "https://nominatim.openstreetmap.org"
TIMEOUT = 30.0
GEOCODING_DELAY = 1.1  # Nominatim requires 1 request per second
MAX_GEOCODING_OPERATIONS = 50  # Limit geocoding to avoid rate limits


async def geocode_address(
    address: str, 
    city: str, 
    client: httpx.AsyncClient
) -> tuple[Optional[float], Optional[float]]:
    """
    Geocode an address using OpenStreetMap Nominatim API.
    Returns (latitude, longitude) or (None, None) if geocoding fails.
    """
    try:
        query = f"{address}, {city}, Finland"
        response = await client.get(
            f"{NOMINATIM_API_BASE}/search",
            params={
                "q": query,
                "format": "json",
                "limit": 1,
            },
            headers={
                "User-Agent": "Kirjastokaveri/1.0 (Library Finder App)",
            },
            timeout=10.0
        )
        response.raise_for_status()
        data = response.json()
        
        if data and len(data) > 0:
            lat = float(data[0]["lat"])
            lon = float(data[0]["lon"])
            logger.info(f"Geocoded '{address}, {city}' -> ({lat}, {lon})")
            return lat, lon
    except Exception as e:
        logger.debug(f"Geocoding failed for '{address}, {city}': {e}")
    
    return None, None


async def fetch_all_libraries() -> list[Dict[str, Any]]:
    """
    Fetch all libraries from Kirjastot.fi API.
    API docs: https://api.kirjastot.fi/v4/
    
    IMPORTANT: The API has a bug with the 'page' parameter - it returns
    the same results for all pages. Use 'skip' parameter instead.
    """
    logger.info("Fetching libraries from Kirjastot.fi API...")
    
    libraries = []
    skip = 0
    limit = 100
    
    async with httpx.AsyncClient(timeout=TIMEOUT) as client:
        while True:
            try:
                response = await client.get(
                    f"{KIRJASTOT_API_BASE}/library",
                    params={
                        "limit": limit,
                        "skip": skip,  # Use skip instead of page (API bug)
                        "lang": "en",
                    },
                    headers={
                        "User-Agent": "Kirjastokaveri/1.0 (Library Finder App)",
                        "Accept": "application/json",
                    }
                )
                response.raise_for_status()
                data = response.json()
                
                items = data.get("items", [])
                if not items:
                    break
                
                libraries.extend(items)
                logger.info(f"Fetched skip={skip}: {len(items)} libraries (total: {len(libraries)})")
                
                skip += limit
                
                # Small delay to be respectful to the API
                await asyncio.sleep(0.5)
                
            except Exception as e:
                logger.error(f"Error fetching at skip {skip}: {e}")
                break
    
    logger.info(f"Total unique libraries fetched: {len(libraries)}")
    return libraries


def extract_library_data(api_library: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """
    Extract relevant fields from Kirjastot.fi API response.
    
    API response structure:
    {
        "id": 84834,
        "name": "Helsinki Central Library Oodi",
        "city": {"name": "Helsinki"},
        "address": {"street": "Töölönlahdenkatu 4", "zipcode": "00100", "city": "Helsinki"},
        "coordinates": {"lat": 60.1733, "lon": 24.9369},
        "email": "oodi@hel.fi",
        "homepage": "https://www.oodihelsinki.fi/",
        "consortium": [{"name": "Helmet"}]
    }
    """
    try:
        # Extract coordinates if available
        coordinates = api_library.get("coordinates", {})
        lat = coordinates.get("lat") if coordinates else None
        lon = coordinates.get("lon") if coordinates else None
        
        # Convert to float if present
        if lat and lon:
            lat = float(lat)
            lon = float(lon)
        else:
            lat = None
            lon = None
        
        # Extract address
        address_obj = api_library.get("address", {})
        street = address_obj.get("street", "")
        zipcode = address_obj.get("zipcode", "")
        city_name = address_obj.get("city", "")
        
        # Fallback to city object if address.city is empty
        if not city_name:
            city_obj = api_library.get("city", {})
            city_name = city_obj.get("name", "")
        
        # Format full address
        address_parts = [street, f"{zipcode} {city_name}".strip()]
        full_address = ", ".join(part for part in address_parts if part)
        
        # Extract library system/consortium
        consortium = api_library.get("consortium", [])
        if isinstance(consortium, list) and len(consortium) > 0:
            library_system = consortium[0].get("name", "Independent")
        else:
            library_system = "Independent"
        
        return {
            "name": api_library.get("name", "Unknown Library"),
            "city": city_name or "Unknown",
            "address": full_address or None,
            "street": street,  # Keep for geocoding
            "latitude": lat,
            "longitude": lon,
            "library_system": library_system,
            "email": api_library.get("email"),
            "homepage": api_library.get("homepage"),
            "phone": api_library.get("phone"),
            "external_id": str(api_library.get("id")),
        }
    except Exception as e:
        logger.error(f"Error extracting data for {api_library.get('name', 'Unknown')}: {e}")
        return None


async def populate_database(libraries_data: list[Dict[str, Any]]) -> tuple[int, int, int, int]:
    """
    Populate database with library data, including geocoding for libraries without coordinates.
    Returns: (added, updated, geocoded, skipped)
    """
    settings = get_settings()
    engine = create_engine(settings.database_url)
    SessionLocal = sessionmaker(bind=engine)
    db = SessionLocal()
    
    added = 0
    updated = 0
    geocoded = 0
    skipped = 0
    
    try:
        async with httpx.AsyncClient() as geo_client:
            for lib_data in libraries_data:
                try:
                    # Check if library already exists by external_id
                    query = select(Library).where(
                        Library.external_id == lib_data["external_id"]
                    )
                    existing = db.execute(query).scalars().first()
                    
                    # Geocode if no coordinates but has address (limit geocoding operations)
                    if geocoded < MAX_GEOCODING_OPERATIONS:
                        if not lib_data.get("latitude") or not lib_data.get("longitude"):
                            street = lib_data.get("street")
                            city = lib_data.get("city")
                            
                            if street and city:
                                lat, lon = await geocode_address(street, city, geo_client)
                                if lat and lon:
                                    lib_data["latitude"] = lat
                                    lib_data["longitude"] = lon
                                    geocoded += 1
                                    await asyncio.sleep(GEOCODING_DELAY)
                    
                    # Skip if still no coordinates
                    if not lib_data.get("latitude") or not lib_data.get("longitude"):
                        logger.debug(f"Skipping {lib_data['name']}: No coordinates available")
                        skipped += 1
                        continue
                    
                    # Remove temporary street field
                    lib_data_copy = {k: v for k, v in lib_data.items() if k != "street"}
                    
                    if existing:
                        # Update existing library
                        for key, value in lib_data_copy.items():
                            if value is not None:
                                setattr(existing, key, value)
                        existing.is_active = True
                        updated += 1
                        logger.debug(f"Updated: {lib_data['name']}")
                    else:
                        # Add new library
                        library = Library(**lib_data_copy, is_active=True)
                        db.add(library)
                        added += 1
                        logger.debug(f"Added: {lib_data['name']}")
                    
                    # Commit every 50 libraries to avoid huge transactions
                    if (added + updated) % 50 == 0:
                        db.commit()
                        logger.info(f"Progress: {added} added, {updated} updated, {geocoded} geocoded, {skipped} skipped")
                        
                except Exception as e:
                    logger.error(f"Error processing {lib_data.get('name', 'Unknown')}: {e}")
                    skipped += 1
                    db.rollback()
        
        # Final commit
        db.commit()
        logger.info("✅ Database population complete!")
        logger.info(f"   Added: {added}")
        logger.info(f"   Updated: {updated}")
        logger.info(f"   Geocoded: {geocoded}")
        logger.info(f"   Skipped: {skipped}")
        
    finally:
        db.close()
    
    return added, updated, geocoded, skipped


async def main():
    """Main execution flow"""
    logger.info("🚀 Starting Kirjastot.fi library data import...")
    
    # Fetch from API
    api_libraries = await fetch_all_libraries()
    
    if not api_libraries:
        logger.error("❌ No libraries fetched. Exiting.")
        return
    
    # Extract and validate data
    logger.info("📊 Extracting and validating library data...")
    valid_libraries = []
    for lib in api_libraries:
        extracted = extract_library_data(lib)
        if extracted:
            valid_libraries.append(extracted)
    
    logger.info(f"✅ Valid libraries: {len(valid_libraries)}/{len(api_libraries)}")
    
    if not valid_libraries:
        logger.error("❌ No valid libraries to import. Exiting.")
        return
    
    # Populate database
    logger.info("💾 Populating database...")
    added, updated, geocoded, skipped = await populate_database(valid_libraries)
    
    logger.info(f"""
    ╔══════════════════════════════════════╗
    ║   KIRJASTOT.FI IMPORT COMPLETE! 🎉   ║
    ╠══════════════════════════════════════╣
    ║  Total Fetched:  {len(api_libraries):4d}              ║
    ║  Valid Data:     {len(valid_libraries):4d}              ║
    ║  Added:          {added:4d}              ║
    ║  Updated:        {updated:4d}              ║
    ║  Geocoded:       {geocoded:4d}              ║
    ║  Skipped:        {skipped:4d}              ║
    ╚══════════════════════════════════════╝
    """)


if __name__ == "__main__":
    asyncio.run(main())
