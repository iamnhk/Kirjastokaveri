"""Library service for geographic operations."""

from math import acos, cos, radians, sin


def haversine_distance(
    lat1: float, lon1: float, lat2: float, lon2: float
) -> float:
    """
    Calculate the great-circle distance between two points on Earth.

    Uses the Haversine formula to calculate distance in kilometers.

    Args:
        lat1: Latitude of first point in degrees
        lon1: Longitude of first point in degrees
        lat2: Latitude of second point in degrees
        lon2: Longitude of second point in degrees

    Returns:
        Distance in kilometers
    """
    # Earth's radius in kilometers
    EARTH_RADIUS_KM = 6371.0

    # Convert degrees to radians
    lat1_rad = radians(lat1)
    lon1_rad = radians(lon1)
    lat2_rad = radians(lat2)
    lon2_rad = radians(lon2)

    # Haversine formula (using spherical law of cosines for simplicity)
    distance = EARTH_RADIUS_KM * acos(
        cos(lat1_rad) * cos(lat2_rad) * cos(lon2_rad - lon1_rad)
        + sin(lat1_rad) * sin(lat2_rad)
    )

    return distance
