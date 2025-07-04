import React, { useState } from 'react'
import RewardsBasePage from '../../components/RewardsBasePage'
import { useGetStudentRewards } from '../../api/rewards/rewards.queries';
import { useDebounce } from '../../hooks/useDebounce';

function StudentRewards() {
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery);
  const [sortBy, setSortBy] = useState('featured');
  const [showWishlistOnly, setShowWishlistOnly] = useState(false);

  const { data, isLoading, isError, fetchNextPage, hasNextPage, isFetchingNextPage, isFetching, error } = useGetStudentRewards({
    limit: 20,
    search: debouncedSearchQuery,
    sort: 'pointsCost',
    order: sortBy === 'price-low' ? 'asc' : 'desc',
    wishlistOnly: showWishlistOnly,
  });

  // Safely extract rewards from paginated response structure
  const allRewards = data?.pages?.flatMap(page => page.data.rewards) || [];

  return (
    <RewardsBasePage
      role='student'
      allRewards={allRewards}
      isLoading={isLoading}
      isError={isError}
      error={error}
      fetchNextPage={fetchNextPage}
      hasNextPage={hasNextPage}
      isFetchingNextPage={isFetchingNextPage}
      isFetching={isFetching}
      searchQuery={searchQuery}
      setSearchQuery={setSearchQuery}
      sortBy={sortBy}
      setSortBy={setSortBy}
      showWishlistOnly={showWishlistOnly}
      setShowWishlistOnly={setShowWishlistOnly}
    />
  )
}

export default StudentRewards





