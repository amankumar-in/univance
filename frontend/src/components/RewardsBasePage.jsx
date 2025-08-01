import { Badge, Box, Button, Callout, Card, Dialog, DropdownMenu, Flex, Grid, Heading, IconButton, Inset, Select, Spinner, Text, TextField } from '@radix-ui/themes';
import { AlertCircleIcon, Clock, Edit, Eye, EyeOff, Gift, Heart, History, MoreVertical, Plus, Search, ShoppingCart, Sparkles, Trash, Trophy } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { Autoplay, Navigation, Pagination } from 'swiper/modules';
import { Swiper, SwiperSlide } from 'swiper/react';
// Import Swiper styles
import { useInView } from 'react-intersection-observer';
import { Link } from 'react-router';
import { toast } from 'sonner';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import { usePointsDetailsById } from '../api/points/points.queries';
import { useAddToWishlist, useDeleteReward, useRedeemReward, useRemoveFromWishlist, useToggleRewardVisibility } from '../api/rewards/rewards.mutations';
import rewardsPlaceholder from '../assets/rewardsPlaceholder.png';
import { ConfirmationDialog, EmptyStateCard, Loader, WishlistToggle } from '../components';
import { useAuth } from '../Context/AuthContext';
import { formatDate } from '../utils/helperFunctions';

function RewardsBasePage({
  role = 'student',
  allRewards,
  isLoading,
  isError,
  error,
  fetchNextPage,
  hasNextPage,
  isFetchingNextPage,
  isFetching,
  searchQuery,
  setSearchQuery,
  sortBy,
  setSortBy,
  showWishlistOnly,
  setShowWishlistOnly,
  creatorId = null
}) {
  const [selectedReward, setSelectedReward] = useState(null);
  const [deleteConfirmReward, setDeleteConfirmReward] = useState(null);
  const { ref, inView } = useInView()

  // Data - Student ID
  const { profiles, user } = useAuth();
  const studentId = profiles?.student?._id;

  // Data - Featured Rewards
  const featuredRewards = allRewards?.filter(reward => reward.isFeatured) || [];

  // Data - Point Account
  const { data: pointAccountData, isLoading: isLoadingPointAccount, isError: isErrorPointAccount, error: errorPointAccount } = usePointsDetailsById(studentId);
  const pointAccount = pointAccountData?.data ?? {};
  const userPoints = pointAccount?.currentBalance ?? 0;

  // Mutations ------------------------------------------------
  const { mutate: redeemReward, isPending: isRedeemingReward } = useRedeemReward();
  const { mutate: deleteReward, isPending: isDeletingReward } = useDeleteReward();
  const { mutate: toggleRewardVisibility, isPending: isTogglingVisibility, variables } = useToggleRewardVisibility();

  const { mutate: addToWishlist, isPending: isAddingToWishlist, variables: addToWishlistVariables } = useAddToWishlist();
  const { mutate: removeFromWishlist, isPending: isRemovingFromWishlist, variables: removeFromWishlistVariables } = useRemoveFromWishlist();

  // Wishlist Toggle
  const toggleWishlist = (rewardId, isInWishlist) => {
    if (isInWishlist) {
      removeFromWishlist({ rewardId, studentId }, {
        onSuccess: () => {
          toast.success('Reward removed from wishlist');
        },
        onError: (error) => {
          toast.error(error.response?.data?.message || 'Failed to remove reward from wishlist');
        }
      });
    } else {
      addToWishlist({ rewardId, studentId }, {
        onSuccess: () => {
          toast.success('Reward added to wishlist');
        },
        onError: (error) => {
          toast.error(error.response?.data?.message || 'Failed to add reward to wishlist');
        }
      });
    }
  }

  // Delete reward handler
  const handleDeleteReward = (rewardId) => {
    deleteReward(rewardId, {
      onSuccess: () => {
        toast.success('Reward deleted successfully');
        setDeleteConfirmReward(null);
      },
      onError: (error) => {
        toast.error(error?.response?.data?.message || error?.message || 'Failed to delete reward');
      }
    });
  }

  // Toggle reward visibility handler
  const handleToggleVisibility = (rewardId, currentVisibility) => {
    const newVisibility = !currentVisibility;

    toggleRewardVisibility({ id: rewardId, isVisible: newVisibility }, {
      onSuccess: () => {
        toast.success(newVisibility ? 'Reward is now visible to children' : 'Reward is now hidden from children');
      },
      onError: (error) => {
        toast.error(error?.response?.data?.message || error?.message || 'Failed to update reward visibility');
      }
    });
  }

  useEffect(() => {
    if (inView && hasNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage]);

  const canAfford = (pointsCost) => userPoints >= pointsCost;

  if (isLoading) return (
    <Flex justify='center' align='center'>
      <Loader />
    </Flex>
  );

  if (isError) return (
    <Callout.Root color='red'>
      <Callout.Icon>
        <AlertCircleIcon size={16} />
      </Callout.Icon>
      <Callout.Text>
        {error?.response?.data?.message || error?.message || 'Something went wrong while fetching user details'}
      </Callout.Text>
    </Callout.Root>
  );

  return (
    <Box className='space-y-6' >
      {/* Header Section */}
      <Box>
        <Flex direction="column" gap="4">
          <Flex justify="between" align="center" wrap={'wrap'} gap={'4'} >
            <div>
              <Flex align="center" gap="3">
                <Text size="7" weight="bold">
                  {showWishlistOnly ? 'My Wish List' : 'Rewards Store'}
                </Text>
              </Flex>
              <Text size="3" color="gray" className="block mt-2">
                {showWishlistOnly
                  ? 'Your saved rewards ready for redemption'
                  : 'Redeem your scholarship points for amazing rewards'
                }
              </Text>
            </div>
            <Flex gap="3" align="center">
              {role === 'student' &&
                <>
                  <Card>
                    <Flex align="center" gap="4">
                      <Trophy className="text-[--yellow-9]" size={24} />
                      <Text as='p' size="5" weight="bold">{userPoints.toLocaleString()} SP</Text>
                    </Flex>
                  </Card>

                  <Link to="/student/redemption-history">
                    <Button variant="outline">
                      <History size={16} />
                      <Text className="hidden sm:inline">Redemption History</Text>
                      <Text className="sm:hidden">History</Text>
                    </Button>
                  </Link>
                </>
              }
              {role === 'parent' && (
                <Flex gap="2" wrap={'wrap'}>
                  <Button asChild variant="outline">
                    <Link to="/parent/pending-redemptions">
                      <Clock size={16} />
                      Pending Redemptions
                    </Link>
                  </Button>
                  <Button asChild>
                    <Link to="/parent/rewards/create">
                      <Plus size={16} />
                      Create Reward
                    </Link>
                  </Button>
                </Flex>
              )}
            </Flex>
          </Flex>
        </Flex>
      </Box>

      {/* Featured Rewards Banner - Hidden when showing wishlist only */}
      {!showWishlistOnly && (
        <Box className="relative flex-1">
          <Text as='p' className='flex gap-2 items-center mb-2' weight='bold'>
            <Sparkles size={16} color='var(--amber-9)' />  Featured Rewards
          </Text>
          <Box className="overflow-hidden rounded-xl shadow-lg md:rounded-2xl">
            <Swiper
              modules={[Navigation, Pagination, Autoplay]}
              spaceBetween={0}
              slidesPerView={1}
              navigation={{
                prevEl: '.swiper-nav-prev',
                nextEl: '.swiper-nav-next',
              }}
              pagination={{
                clickable: true,
                bulletClass: 'swiper-pagination-bullet',
                bulletActiveClass: 'swiper-pagination-bullet-active'
              }}
              autoplay={{ delay: 6000, disableOnInteraction: false }}
              loop={true}
              grabCursor
              className="mySwiper"
            >
              {featuredRewards.map((reward) => (
                <SwiperSlide key={reward._id} className='!w-full !max-w-full'>
                  <Box className="relative p-4 md:p-6">
                    {/* Background with sophisticated gradient */}
                    <Box className="absolute inset-0 bg-gradient-to-br from-[--accent-2] via-[--accent-3] to-[--accent-4]" />

                    {/* Geometric pattern overlay */}
                    <Box
                      className="absolute inset-0 opacity-[0.02] md:opacity-[0.05]"
                      style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3Cpattern id='grid' width='15' height='15' patternUnits='userSpaceOnUse'%3E%3Cpath d='M 15 0 L 0 0 0 15' fill='none' stroke='%23000' stroke-width='1'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width='60' height='60' fill='url(%23grid)'/%3E%3C/svg%3E")`
                      }}
                    />

                    {/* Main content */}
                    <Grid className="relative gap-4 md:gap-6" columns={'3'} >

                      {/* Left image section */}
                      <Box className="col-span-1 max-w-xs" >
                        <Box className="relative">
                          {/* Main product image */}
                          <Box className="overflow-hidden relative rounded-xl shadow-xl lg:rounded-2xl lg:shadow-2xl">
                            <img
                              loading='lazy'
                              src={reward.image || rewardsPlaceholder}
                              alt={reward.title}
                              className="object-cover object-center w-full h-full aspect-square"
                              onError={(e) => {
                                e.currentTarget.src = rewardsPlaceholder;
                              }}
                            />

                            {/* Image overlay gradient */}
                            <Box className="absolute inset-0 bg-gradient-to-t to-transparent from-black/10" />
                          </Box>
                        </Box>
                      </Box>

                      {/* Right content section */}
                      <Box className="flex flex-col col-span-2 gap-2 h-full sm:gap-3 md:gap-4">

                        {/* Title with modern typography */}
                        <Heading
                          size={{ initial: '3', sm: '4', md: '6' }}
                          weight="bold"
                          className="mb-1 line-clamp-2"
                        >
                          {reward.title}
                        </Heading>

                        {/* Stats row */}
                        <Flex gap={{ initial: '2', sm: '3', md: '4' }} align='center' wrap={'wrap'}>
                          {/* Points card */}
                          <Badge size={'3'} highContrast className='self-start'>
                            SP Required:
                            <Text as='p' size={'3'} weight='bold'>
                              {reward.pointsCost.toLocaleString()}
                            </Text>
                          </Badge>

                          {/* Limited quantity warning */}
                          {reward.limitedQuantity && (
                            <Badge size={'3'} variant='solid' className='self-start'
                              color={reward.quantity === 0 ? 'gray' : 'red'}
                            >
                              <Clock size={16} /> {reward.quantity === 0 ? 'Out of Stock' : `Only ${reward.quantity} left`}
                            </Badge>
                          )}
                        </Flex>

                        {/* Action buttons */}
                        {role === 'student' && (
                          <div className='hidden md:block'>
                            <RedeemButton reward={reward} setSelectedReward={setSelectedReward} canAfford={canAfford} />
                          </div>
                        )}
                      </Box>
                      {/* Action buttons */}
                      {role === 'student' && (
                        <div className='block md:hidden'>
                          <RedeemButton reward={reward} setSelectedReward={setSelectedReward} canAfford={canAfford} />
                        </div>
                      )}
                    </Grid>
                  </Box>
                </SwiperSlide>
              ))}
            </Swiper>
          </Box>
        </Box>
      )}

      {/* Filters and Search */}
      <Box>
        <Flex gap="4" align='center' wrap={'wrap'}>
          {/* Search */}
          <Box className="flex-1 min-w-[200px]">
            <TextField.Root
              placeholder="Search rewards..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}>
              <TextField.Slot>
                <Search size={16} />
              </TextField.Slot>
            </TextField.Root>
          </Box>

          {/* Wishlist Filter */}
          {role === 'student' && <Button
            variant={showWishlistOnly ? "solid" : "outline"}
            color={showWishlistOnly ? "red" : "gray"}
            onClick={() => setShowWishlistOnly(!showWishlistOnly)}
          >
            <Heart size={16} className={showWishlistOnly ? "fill-current" : ""} />
            {showWishlistOnly ? 'All' : 'Wish List'}
          </Button>}

          {/* Sort */}
          <Select.Root value={sortBy} onValueChange={setSortBy}>
            <Select.Trigger>
              Sort by
            </Select.Trigger>
            <Select.Content variant='soft' position='popper'>
              <Select.Item value="price-low">Price: Low to High</Select.Item>
              <Select.Item value="price-high">Price: High to Low</Select.Item>
            </Select.Content>
          </Select.Root>
        </Flex>
      </Box>

      {/* Rewards Grid */}
      <Flex justify="between" align="center" wrap={'wrap'} gap={'2'}>
        <Text as='p' size="2" color="gray" className='flex gap-2 items-center'>
          Showing {allRewards.length} {showWishlistOnly ? 'wishlist items' : 'rewards'} <Spinner loading={isFetching} />
        </Text>
        {role === 'student' && <Flex align="center" gap="2">
          <Text size="2" color="gray">Your balance:</Text>
          <Badge color="green" variant="soft" size="2">
            <Trophy size={12} />
            {userPoints.toLocaleString()} SP
          </Badge>
        </Flex>}
      </Flex>

      {allRewards.length > 0 ? (
        <>
          <Grid columns={{ initial: '2', xs: '3', sm: '2', md: '3', lg: '4', xl: '5' }} gap="3">
            {allRewards.map((reward) => (
              <Card
                size='1'
                key={reward._id}
                className="flex flex-col shadow-md transition cursor-pointer hover:shadow-lg"
                onClick={() => setSelectedReward(reward)}
              >
                <Inset clip="padding-box" side="top">
                  <Box className="relative">
                    <img
                      src={reward?.image || rewardsPlaceholder}
                      alt={reward?.title}
                      loading='lazy'
                      className="object-cover object-center w-full h-full aspect-square bg-[--gray-5]"
                      onError={(e) => {
                        e.currentTarget.src = rewardsPlaceholder;
                      }}
                    />
                    {reward.badge && (
                      <Box className="absolute top-2 left-2">
                        <Badge color="red" variant="solid" size="1">
                          {reward.badge}
                        </Badge>
                      </Box>
                    )}

                    {reward?.isFeatured && (
                      <Box className="absolute top-2 left-2">
                        <Badge color="cyan" variant="solid" size="1">
                          <Sparkles size={12} /> Featured
                        </Badge>
                      </Box>
                    )}

                    {/* Wishlist Toggle */}
                    {role === 'student' && <WishlistToggle
                      isInWishlist={reward.isInWishlist}
                      onToggle={() => toggleWishlist(reward._id, reward.isInWishlist)}
                      className="absolute top-2 right-2 backdrop-blur-sm bg-black/50"
                      variant="soft"

                      loading={((isAddingToWishlist && addToWishlistVariables?.rewardId === reward._id) || (isRemovingFromWishlist && removeFromWishlistVariables?.rewardId === reward._id))}
                    />}



                    {/* Limited Quantity Badge */}
                    {reward.limitedQuantity && (
                      <Box className="absolute bottom-2 left-2">
                        <Badge
                          color={reward.quantity === 0 ? "gray" : "orange"}
                          variant="solid"
                          size="1"
                        >
                          <Clock size={10} />
                          {reward.quantity === 0 ? 'Out of Stock' : `Only ${reward.quantity} left`}
                        </Badge>
                      </Box>
                    )}
                  </Box>
                </Inset>

                <Box mt={'2'} className='flex flex-col flex-1 justify-between'>
                  <div>
                    <Flex align="center" gap="2" className="mb-1">
                      <Text size="1" color="gray" className="capitalize">
                        {reward?.categoryId?.name}
                      </Text>
                    </Flex>

                    <Flex justify="between" align="center" className="mb-1">
                      <Text as='p' size="2" className="line-clamp-3" weight="medium">
                        {reward.title}
                      </Text>
                      {/* More actions menu - Only for parent-created rewards */}
                      {creatorId === reward.creatorId && (
                        <Flex justify="end">
                          <DropdownMenu.Root>
                            <DropdownMenu.Trigger>
                              <IconButton
                                variant="ghost"
                                color="gray"
                                size="2"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <MoreVertical size={16} />
                              </IconButton>
                            </DropdownMenu.Trigger>
                            <DropdownMenu.Content variant='soft' onClick={(e) => e.stopPropagation()}>
                              <DropdownMenu.Item asChild>
                                <Link to={`/parent/rewards/edit/${reward._id}`}>
                                  <Edit size={14} />
                                  Edit Reward
                                </Link>
                              </DropdownMenu.Item>
                              <DropdownMenu.Item
                                color="red"
                                onClick={() => setDeleteConfirmReward(reward)}
                                disabled={isDeletingReward}
                              >
                                <Trash size={14} />
                                Delete Reward
                              </DropdownMenu.Item>
                            </DropdownMenu.Content>
                          </DropdownMenu.Root>
                        </Flex>
                      )}
                    </Flex>
                    <Flex justify="between" align="center" className="mb-3" wrap={'wrap'} gap='1'>
                      <Flex align="center" gap="1">
                        <Trophy size={14} />
                        <Text as='p' className='font-semibold'>
                          {reward.pointsCost.toLocaleString()} SP
                        </Text>
                      </Flex>
                      {reward.expiryDate && (
                        <Flex align="center" gap="1">
                          <Clock size={12} className="text-[--orange-11]" />
                          <Text as='p' size="1" color="orange">
                            Expires {formatDate(reward.expiryDate)}
                          </Text>
                        </Flex>
                      )}
                    </Flex>
                  </div>
                  {role === 'student' && <Button
                    size="2"
                    className="w-full disabled:cursor-not-allowed"
                    disabled={!canAfford(reward.pointsCost) || (reward.limitedQuantity && reward.quantity === 0)}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedReward(reward);
                    }}
                  >
                    <ShoppingCart size={16} />
                    {reward.limitedQuantity && reward.quantity === 0
                      ? 'Out of Stock'
                      : canAfford(reward.pointsCost)
                        ? 'Redeem'
                        : 'Not Enough Points'
                    }
                  </Button>}

                  {role === 'parent' && (
                    <div className="space-y-2">
                      {/* Visibility Toggle Button - Available for all rewards */}
                      <Button
                        size="2"
                        variant={reward.isVisibleToMyChildren
                          ? "outline" : "solid"}
                        color={reward.isVisibleToMyChildren
                          ? "blue" : "gray"}
                        className="w-full"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleVisibility(reward._id, reward.isVisibleToMyChildren);
                        }}
                        loading={isTogglingVisibility && variables?.id === reward._id}
                      >
                        {reward.isVisibleToMyChildren ? <Eye size={16} /> : <EyeOff size={16} />}
                        {reward.isVisibleToMyChildren ? 'Hide from Children' : 'Show to Children'}
                      </Button>


                    </div>
                  )}
                </Box>
              </Card>
            ))}
          </Grid>

          {isFetchingNextPage && (
            <Flex justify='center' align='center'>
              <Loader />
            </Flex>
          )}
          {(hasNextPage && !isFetchingNextPage) && <div ref={ref}></div>}
          {!hasNextPage && !isFetchingNextPage && (
            <Flex justify='center' align='center'>
              <Text as='p' size="1" color="gray" className='text-nowrap' >No more rewards to show</Text>
            </Flex>
          )}
        </>
      ) : (
        <EmptyStateCard
          title={showWishlistOnly ? 'Your wishlist is empty' : 'No rewards found'}
          description={showWishlistOnly
            ? 'Add rewards to your wishlist by clicking the heart icon on reward cards'
            : 'Try adjusting your search or filter criteria'
          }
          icon={showWishlistOnly ? <Heart size={32} className="text-[--red-9]" /> : <Gift />}
        />
      )
      }

      {/* Reward Detail Modal */}
      <Dialog.Root open={!!selectedReward} onOpenChange={setSelectedReward}>
        <Dialog.Content className='max-w-4xl' aria-describedby={undefined}>
          {selectedReward && (
            <>
              <Dialog.Title>{selectedReward.title}</Dialog.Title>
              <div className='space-y-4'>
                <Flex direction={{ initial: 'column', sm: 'row' }} align={{ sm: 'start' }} gap="4">
                  <img
                    loading='lazy'
                    src={selectedReward?.image || rewardsPlaceholder}
                    alt={selectedReward?.title}
                    className="object-cover object-center w-full rounded-lg md:w-1/2 aspect-auto bg-[--gray-5]"
                    onError={(e) => {
                      e.currentTarget.src = rewardsPlaceholder;
                    }}
                  />
                  <div className='flex-1 space-y-3'>
                    <Flex align="center" gap="2">
                      <Text as='p' size="2" color="gray" className="capitalize">
                        {selectedReward.categoryId?.type}
                      </Text>
                      {selectedReward.badge && (
                        <Badge color="red" variant="soft" size="1">
                          {selectedReward.badge}
                        </Badge>
                      )}
                    </Flex>

                    <Text as='p' className="whitespace-pre-wrap">{selectedReward.description}</Text>

                    <Flex justify="between" align="center" className="p-4 bg-[--gray-a2] rounded-lg">
                      <Box>
                        <Text as='p' size="2" color="gray"> Scholarship Points Required</Text>
                        <Flex align="center" gap="1">
                          <Trophy size={16} />
                          <Text as='p' size="4" weight="bold" >
                            {selectedReward.pointsCost.toLocaleString()} SP
                          </Text>
                        </Flex>
                      </Box>
                      {role === 'student' && (
                        <Box className="text-right">
                          <Text as='p' size="2" color="gray">Your Balance</Text>
                          <Text as='p' size="3" weight="bold">
                            {userPoints.toLocaleString()}
                          </Text>
                        </Box>
                      )}
                    </Flex>

                    {selectedReward.limitedQuantity && (
                      <Callout.Root
                        variant='surface'
                        color={selectedReward.quantity === 0 ? 'gray' : 'orange'}
                      >
                        <Callout.Icon>
                          <Clock size={16} />
                        </Callout.Icon>
                        <Callout.Text>
                          {selectedReward.quantity === 0
                            ? 'This reward is currently out of stock'
                            : `Limited quantity: Only ${selectedReward.quantity} remaining`
                          }
                        </Callout.Text>
                      </Callout.Root>
                    )}

                    {selectedReward.expiryDate && (
                      <Callout.Root variant='surface' color='yellow'>
                        <Callout.Icon>
                          <Clock size={16} />
                        </Callout.Icon>
                        <Callout.Text>
                          Expires on {formatDate(selectedReward.expiryDate)}
                        </Callout.Text>
                      </Callout.Root>
                    )}
                  </div>

                </Flex>
                {selectedReward.redemptionInstructions && (
                  <div>
                    <Text as='p' size="2" weight="medium" mb="1" color="gray">Redemption Instructions</Text>
                    <Text as='p' className="pl-4 whitespace-pre-wrap">
                      {selectedReward.redemptionInstructions}
                    </Text>
                  </div>
                )}

                {selectedReward.restrictions && (
                  <div>
                    <Text as='p' size="2" weight="medium" mb="1" color="gray">Restrictions</Text>
                    <Text as='p' className="pl-4 whitespace-pre-wrap">
                      {selectedReward.restrictions}
                    </Text>
                  </div>
                )}
              </div>
              <Flex gap="3" mt="4" justify="end">
                <Dialog.Close>
                  <Button disabled={isRedeemingReward} variant="soft" color="gray">
                    Cancel
                  </Button>
                </Dialog.Close>
                {role === 'student' && <Button
                  disabled={
                    !canAfford(selectedReward.pointsCost) ||
                    isRedeemingReward ||
                    (selectedReward.limitedQuantity && selectedReward.quantity === 0)
                  }
                  onClick={() => {
                    redeemReward({
                      id: selectedReward._id,
                      studentId
                    }, {
                      onSuccess: () => {
                        toast.success('Reward redeemed successfully');
                        setSelectedReward(null);
                      },
                      onError: (error) => {
                        toast.error(error?.response?.data?.message || error?.message || 'Failed to redeem reward');
                      }
                    });
                  }}
                  className='disabled:cursor-not-allowed'
                >
                  <ShoppingCart size={16} />
                  {selectedReward.limitedQuantity && selectedReward.quantity === 0
                    ? 'Out of Stock'
                    : canAfford(selectedReward.pointsCost)
                      ? isRedeemingReward
                        ? 'Processing...'
                        : 'Confirm Redemption'
                      : 'Not Enough Points'
                  }
                </Button>}
              </Flex>
            </>
          )}
        </Dialog.Content>
      </Dialog.Root>

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        open={!!deleteConfirmReward}
        onOpenChange={() => {
          if (isDeletingReward) return;
          setDeleteConfirmReward(null);
        }}
        title="Delete Reward"
        description={deleteConfirmReward ? `Are you sure you want to delete "${deleteConfirmReward.title}"? This action cannot be undone.` : ''}
        confirmText="Delete Reward"
        confirmColor="red"
        confirmIcon={<Trash size={16} />}
        isLoading={isDeletingReward}
        onConfirm={() => deleteConfirmReward && handleDeleteReward(deleteConfirmReward._id)}
      />

    </Box >
  );
}

export default RewardsBasePage;

function RedeemButton({ reward, setSelectedReward, canAfford, }) {
  return (
    <Button
      size={{ initial: '2', md: '3' }}
      className={`w-max font-medium md:font-semibold px-4 md:px-8 py-2 md:py-3 shadow-md md:shadow-lg transition-all duration-300  ${reward.limitedQuantity && reward.quantity === 0
        ? 'bg-[--gray-6] text-[--gray-11] cursor-not-allowed'
        : canAfford(reward.pointsCost)
          ? 'bg-gradient-to-r from-[--accent-9] to-[--accent-10] text-white hover:shadow-xl hover:scale-105'
          : 'bg-[--gray-6] text-[--gray-11] cursor-not-allowed'
        }`}
      disabled={!canAfford(reward.pointsCost) || (reward.limitedQuantity && reward.quantity === 0)}
      onClick={() => setSelectedReward(reward)}
    >
      <ShoppingCart size={16} className="md:w-[18px] md:h-[18px]" />
      <Text className="hidden sm:inline">
        {reward.limitedQuantity && reward.quantity === 0
          ? 'Out of Stock'
          : canAfford(reward.pointsCost)
            ? 'Redeem Now'
            : 'Insufficient Points'
        }
      </Text>
      <Text className="sm:hidden">
        {reward.limitedQuantity && reward.quantity === 0
          ? 'Sold Out'
          : canAfford(reward.pointsCost)
            ? 'Redeem'
            : 'Not Enough'
        }
      </Text>
    </Button>
  )
}