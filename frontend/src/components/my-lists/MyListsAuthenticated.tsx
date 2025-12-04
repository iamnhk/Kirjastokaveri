import { Suspense, lazy, type ReactElement } from 'react';
import { MyListsStats } from './MyListsStats';
import { MyListsTabs, type MyListsTab } from './MyListsTabs';
import { ReadingListSection } from './ReadingListSection';
import { WishlistSection } from './WishlistSection';
import { ReservationsSection } from './ReservationsSection';
import { CompletedSection } from './CompletedSection';
import { ReadingProgressModal } from './ReadingProgressModal';
import { CompleteBookModal } from './CompleteBookModal';
import { DueDateModal } from './DueDateModal';
import { useMyListsController } from './useMyListsController';

const LibrarySelectionModalLazy = lazy(() =>
  import('../book/LibrarySelectionModal').then((module) => ({ default: module.LibrarySelectionModal }))
);

const SECTION_RENDERERS: Record<
  MyListsTab,
  (props: ReturnType<typeof useMyListsController>) => ReactElement
> = {
  reading: ({
    readingList,
    progressModal,
    completeModal,
    removeFromReading,
    navigateToBrowse,
  }) => (
    <ReadingListSection
      books={readingList}
      onUpdateProgress={progressModal.open}
      onMarkComplete={completeModal.open}
      onRemove={removeFromReading}
      onAddBook={navigateToBrowse}
    />
  ),
  wishlist: ({ wishlist, handleReserve, removeFromWishlist, libraryModal }) => (
    <WishlistSection
      books={wishlist}
      onReserve={handleReserve}
      onRemove={removeFromWishlist}
      onEditTracking={libraryModal.open}
    />
  ),
  reservations: ({
    reservations,
    handlePickUp,
    updateReservationStatus,
    removeFromReservations,
    handleStartReading,
  }) => (
    <ReservationsSection
      books={reservations}
      onPickUp={handlePickUp}
      onUpdateStatus={updateReservationStatus}
      onRemove={removeFromReservations}
      onStartReading={handleStartReading}
    />
  ),
  completed: ({ completedList, moveToReading, removeFromCompleted }) => (
    <CompletedSection books={completedList} onReread={moveToReading} onRemove={removeFromCompleted} />
  ),
};

export function MyListsAuthenticated() {
  const controller = useMyListsController();
  const { readingList, wishlist, reservations, completedList, activeTab, setActiveTab } = controller;

  const ActiveSection = SECTION_RENDERERS[activeTab];

  return (
    <>
      <MyListsStats
        readingCount={readingList.length}
        wishlistCount={wishlist.length}
        reservationsCount={reservations.length}
        completedCount={completedList.length}
      />

      <MyListsTabs activeTab={activeTab} onTabChange={setActiveTab} />

      <ActiveSection {...controller} />

      <MyListsModals {...controller} />
    </>
  );
}

function MyListsModals(
  controller: Pick<
    ReturnType<typeof useMyListsController>,
    'progressModal' | 'completeModal' | 'dueDateModal' | 'libraryModal'
  >,
) {
  const { progressModal, completeModal, dueDateModal, libraryModal } = controller;

  return (
    <>
      {progressModal.isOpen && progressModal.book && (
        <ReadingProgressModal
          book={progressModal.book}
          progress={progressModal.progress}
          onProgressChange={progressModal.setProgress}
          onClose={progressModal.close}
          onConfirm={progressModal.confirm}
        />
      )}

      {completeModal.isOpen && completeModal.book && (
        <CompleteBookModal
          book={completeModal.book}
          rating={completeModal.rating}
          onRatingChange={completeModal.setRating}
          onClose={completeModal.close}
          onConfirm={completeModal.confirm}
        />
      )}

      {dueDateModal.isOpen && dueDateModal.book && (
        <DueDateModal
          book={dueDateModal.book}
          dueDate={dueDateModal.dueDate}
          onDueDateChange={dueDateModal.setDate}
          onClose={dueDateModal.close}
          onConfirm={dueDateModal.confirm}
        />
      )}

      <Suspense fallback={null}>
        {libraryModal.book && (
          <LibrarySelectionModalLazy
            book={libraryModal.book}
            isOpen
            onClose={libraryModal.close}
            onLibrarySelection={libraryModal.submit}
          />
        )}
      </Suspense>
    </>
  );
}
