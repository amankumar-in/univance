import { AlertDialog, Avatar, Badge, Box, Button, Callout, Card, DataList, Dialog, Flex, Heading, Select, Separator, Text, TextArea } from '@radix-ui/themes'
import '@radix-ui/themes/styles.css'
import { AlertCircleIcon, BookOpen, CheckCircle, Clock, FileImage, FileText, Funnel, Link as LinkIcon, MessageSquare, RotateCw, XCircle } from 'lucide-react'
import React, { useState } from 'react'
import { toast } from 'sonner'
import { useReviewTask } from '../../api/task/task.mutations'
import { useGetTasksForApproval } from '../../api/task/task.queries'
import { EmptyStateCard, Loader } from '../../components'
import { formatDate } from '../../utils/helperFunctions'

function ParentClaims() {
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedClaim, setSelectedClaim] = useState(null);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectFeedback, setRejectFeedback] = useState('');
  const [claimToReject, setClaimToReject] = useState(null);

  // State for filtering and sorting
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('updatedAt');
  const [sortOrder, setSortOrder] = useState('desc');

  const { data, isLoading, isError, error, fetchNextPage, hasNextPage, isFetching, refetch } = useGetTasksForApproval({
    role: 'parent',
    sortBy,
    order: sortOrder,
    status: statusFilter,
  });

  const allTasks = data?.pages.flatMap(p => p.data.docs) || [];

  const reviewTask = useReviewTask();

  // Handler to open details modal
  const handleDetailsClick = (claim) => {
    setSelectedClaim(claim);
    setIsDetailsModalOpen(true);
  };

  const handleApprove = (claimId) => {
    reviewTask.mutate({
      id: claimId,
      data: { role: 'parent', action: 'approve' }
    }, {
      onSuccess: () => {
        toast.success('Task approved successfully')
      },
      onError: (error) => {
        console.log(error);
        toast.error(toast.error(error?.response?.data?.message || error?.message || 'Failed to approve this task.'))
      }
    });
  };

  // Handler to open the reject feedback modal
  const handleRejectClick = (claim) => {
    setClaimToReject(claim);
    setIsRejectModalOpen(true);
  };

  const handleRejectConfirm = () => {
    if (!claimToReject) return;

    reviewTask.mutate({
      id: claimToReject._id,
      data: { role: 'parent', action: 'reject', feedback: rejectFeedback }
    }, {
      onSuccess: () => {
        toast.success('Task approval rejected successfully')
        setIsRejectModalOpen(false);
        setRejectFeedback(''); // Clear feedback after submission
        setClaimToReject(null); // Clear claimToReject
      },
      onError: (error) => {
        console.log(error);
        toast.error(toast.error(error?.response?.data?.message || error?.message || 'Failed to reject the approval.'))
      }
    });

  };

  // Determines the color of the status badge
  const getStatusColor = (status) => {
    switch (status) {
      case 'pending_approval':
        return 'orange';
      case 'approved':
        return 'green';
      case 'rejected':
        return 'red';
      case 'pending':
        return 'blue';
      case 'expired':
        return 'gray';
      default:
        return 'gray';
    }
  };

  return (
    <>
      <Box className='mx-auto max-w-5xl'>
        <Heading size='6' mb='2'>
          Task Approvals
        </Heading>

        {/* General helper text */}
        <Text as='p' size='3' color='gray' mb='4'>
          Review and manage task completion requests submitted by your children.
        </Text>

        <Separator my='4' size='4' />

        {/* Filter and Sort Controls */}
        <Flex justify={'between'} align={'center'} mb={'4'} gap='4' wrap={'wrap'}>
          <Button
            variant='ghost'
            color='gray'
            highContrast
            disabled={isFetching}
            onClick={refetch}
          >
            <RotateCw size={14} /> Refresh
          </Button>

          <Flex gap='4' align='center' wrap={'wrap'}>
            <Funnel size={16} />
            <Flex align={'center'} gap={'2'}>
              {/* Status Filter */}
              <label htmlFor='statusFilter' className='text-sm'>Status:</label>
              <Select.Root disabled={isFetching} size={'2'} value={statusFilter} onValueChange={setStatusFilter} id='statusFilter'>
                <Select.Trigger />
                <Select.Content variant='soft' position='popper'>
                  <Select.Item value='all'>All</Select.Item>
                  <Select.Item value='pending_approval'>Pending Approval</Select.Item>
                  <Select.Item value='approved'>Approved</Select.Item>
                  <Select.Item value='rejected'>Rejected</Select.Item>
                </Select.Content>
              </Select.Root>
            </Flex>

            <Flex align={'center'} gap={'2'}>
              {/* Sort By */}
              <label htmlFor='sortBy' className='text-sm'>Sort by:</label>
              <Select.Root disabled={isFetching} size={'2'} value={sortBy} onValueChange={setSortBy} id='sortBy'>
                <Select.Trigger />
                <Select.Content variant='soft' position='popper'>
                  <Select.Item value='updatedAt'>Creation Date</Select.Item>
                </Select.Content>
              </Select.Root>
            </Flex>

            <Flex align={'center'} gap={'2'}>
              {/* Sort Order */}
              <label htmlFor='sortOrder' className='text-sm'>Order:</label>
              <Select.Root disabled={isFetching} size={'2'} value={sortOrder} onValueChange={setSortOrder} id='sortOrder'>
                <Select.Trigger />
                <Select.Content variant='soft' position='popper'>
                  <Select.Item value='desc'>Z-A</Select.Item>
                  <Select.Item value='asc'>A-Z</Select.Item>
                </Select.Content>
              </Select.Root>
            </Flex>
          </Flex>
        </Flex>

        <div className='space-y-4'>
          {/* Display Claims */}
          {isLoading ? (
            <Flex justify="center">
              <Loader />
            </Flex>
          ) : isError ? (
            <Callout.Root color='red'>
              <Callout.Icon>
                <AlertCircleIcon size={16} />
              </Callout.Icon>
              <Callout.Text>
                {error?.response?.data?.message || error?.message || 'Something went wrong'}
              </Callout.Text>
            </Callout.Root>
          ) : allTasks?.length > 0 ? (
            <>
              {allTasks?.map(claim => (
                <Card key={claim._id} size={'2'} className='shadow-md'>
                  <Flex direction='column' gap='2'>
                    <Text size='2' color='gray' className='flex gap-1 items-center'>
                      <Clock size={'14'} /> {claim?.completedAt ? formatDate(claim?.completedAt, { dateStyle: 'medium' }) : 'N/A'}
                    </Text>
                    <Heading className='line-clamp-1' size='4'>{claim?.task?.title || '[Deleted Task]'}</Heading>

                    <Flex justify='between' align='center' gap='2' wrap='wrap'>
                      <Flex align='start' gap='2'>
                        <Avatar
                          src={claim?.childDetails?.avatar}
                          fallback={
                            (claim?.childDetails?.firstName?.charAt(0) || '') + (claim?.childDetails?.lastName?.charAt(0) || '') || '?'
                          }
                          radius='full'
                          size='2'
                        />
                        <div>
                          <Text as='p' size='2'>
                            {claim?.childDetails?.firstName} {claim?.childDetails?.lastName || '[Unknown Student]'}
                          </Text>
                          <Text as='p' size={'1'} color='gray'>
                            {claim?.childDetails?.email || 'N/A'}
                          </Text>

                        </div>
                      </Flex>
                      <Badge
                        color={getStatusColor(claim?.status)}
                      >
                        {claim.status?.replace('_', ' ') || 'Unknown Status'}
                      </Badge>
                    </Flex>

                    <Flex gap='2' mt='2'>
                      {claim?.status === 'pending_approval' && (
                        <>
                          <Button
                            size='1'
                            color='grass'
                            disabled={reviewTask.isPending && reviewTask.variables.id === claim._id}
                            onClick={() => handleApprove(claim._id)}
                          >
                            {reviewTask.isPending && reviewTask.variables.id === claim._id && reviewTask.variables.data?.action === 'approve' ? "Processing..." : "Approve"}
                          </Button>
                          <Button
                            size='1'
                            color='red'
                            disabled={reviewTask.isPending && reviewTask.variables.id === claim._id}
                            onClick={() => handleRejectClick(claim)}
                          >
                            {reviewTask.isPending && reviewTask.variables.id === claim._id && reviewTask.variables.data?.action === 'reject' ? "Processing..." : "Reject"}
                          </Button>
                        </>
                      )}
                      <Button size='1' variant='surface' onClick={() => handleDetailsClick(claim)}>Details</Button>
                    </Flex>
                  </Flex>
                </Card>

              ))}
              <Text as='p' size='1' color='gray' align='center'>
                You've reached the end of the list
              </Text>
            </>
          ) : (
            <EmptyStateCard
              title="No tasks found"
              description="No tasks for approval found."
              icon={<BookOpen size={16} />}
            />
          )}
        </div>

      </Box>
      {/* Details Modal */}
      <Dialog.Root open={isDetailsModalOpen} onOpenChange={setIsDetailsModalOpen}>
        <Dialog.Content className='max-w-2xl'>
          <Dialog.Title>
            {selectedClaim?.task?.title || '[Deleted Task]'}
          </Dialog.Title>
          <Dialog.Description size="2" mb="6">
            {selectedClaim?.task?.description || 'N/A'}
          </Dialog.Description>
          {selectedClaim && (
            <div>
              <Flex gap='4' className='flex-col sm:flex-row'>

                <Avatar
                  src={selectedClaim?.childDetails?.avatar}
                  fallback={
                    (selectedClaim?.childDetails?.firstName?.charAt(0) || '') + (selectedClaim?.childDetails?.lastName?.charAt(0) || '') || '?'
                  }
                  radius='full'
                  size='6'
                />

                <DataList.Root>
                  <DataList.Item>
                    <DataList.Label minWidth="88px">Name</DataList.Label>
                    <DataList.Value>
                      {selectedClaim?.childDetails?.firstName} {selectedClaim.childDetails?.lastName || '[Unknown Student]'}
                    </DataList.Value>
                  </DataList.Item>
                  <DataList.Item>
                    <DataList.Label minWidth="88px">Email</DataList.Label>
                    <DataList.Value>
                      {selectedClaim?.childDetails?.email || 'N/A'}
                    </DataList.Value>
                  </DataList.Item>
                  <DataList.Item>
                    <DataList.Label minWidth="88px">Grade</DataList.Label>
                    <DataList.Value>
                      {selectedClaim?.childDetails?.grade || 'N/A'}
                    </DataList.Value>
                  </DataList.Item>
                  <DataList.Item>
                    <DataList.Label minWidth="88px">Points</DataList.Label>
                    <DataList.Value>
                      {selectedClaim?.task?.pointValue || 'N/A'}
                    </DataList.Value>
                  </DataList.Item>
                  <DataList.Item>
                    <DataList.Label minWidth="88px">Completed At</DataList.Label>
                    <DataList.Value>
                      {selectedClaim.completedAt ? formatDate(selectedClaim.completedAt, { dateStyle: 'medium', timeStyle: 'medium' }) : 'N/A'}
                    </DataList.Value>
                  </DataList.Item>
                  <DataList.Item>
                    <DataList.Label minWidth="88px">Note</DataList.Label>
                    <DataList.Value className='whitespace-pre-wrap'>
                      {selectedClaim?.note || 'N/A'}
                    </DataList.Value>
                  </DataList.Item>
                  <DataList.Item>
                    <DataList.Label minWidth="88px">Status</DataList.Label>
                    <DataList.Value>
                      <Badge color={getStatusColor(selectedClaim.status)}>{selectedClaim.status?.replace('_', ' ') || 'Unknown Status'}</Badge>
                    </DataList.Value>
                  </DataList.Item>
                  <DataList.Item>
                    <DataList.Label minWidth="88px">Evidence</DataList.Label>
                    <DataList.Value>
                      {selectedClaim?.evidence && selectedClaim.evidence.length > 0 ? (
                        <Flex direction="column" gap="2" className='w-full'>
                          {selectedClaim.evidence.map((evidence, index) => (
                            <Card key={index} variant="surface" size="1" >
                              <Flex align="start" gap="2">
                                {evidence.type === 'image' && <FileImage size={14} />}
                                {evidence.type === 'document' && <FileText size={14} />}
                                {evidence.type === 'link' && <LinkIcon size={14} />}
                                {evidence.type === 'text' && <MessageSquare size={14} />}

                                <Flex direction="column" gap="1" style={{ flex: 1, minWidth: 0 }}>
                                  <Text as="p" weight="medium" className="leading-none capitalize">
                                    {evidence.type}
                                  </Text>

                                  {evidence.type === 'text' && evidence.content && (
                                    <Text as="p" className="whitespace-pre-wrap">
                                      {evidence.content}
                                    </Text>
                                  )}

                                  {evidence.type === 'link' && evidence.url && (
                                    <Text as="p" color="blue" className="break-all line-clamp-1 hover:underline" asChild>
                                      <a href={evidence.url} target="_blank" rel="noopener noreferrer" >
                                        {evidence.url}
                                      </a>
                                    </Text>
                                  )}

                                  {(evidence.type === 'image' || evidence.type === 'document') && evidence.url && (
                                    <Flex direction="column" gap="1">
                                      <Text as="p" color="blue" className="break-all line-clamp-1 hover:underline" asChild>
                                        <a href={evidence.url} target="_blank" rel="noopener noreferrer">
                                          {evidence.fileName || 'View File'}
                                        </a>
                                      </Text>
                                      {evidence.contentType && (
                                        <Text as='p' size='1' color="gray">
                                          {evidence.contentType}
                                        </Text>
                                      )}
                                    </Flex>
                                  )}
                                </Flex>
                              </Flex>
                            </Card>
                          ))}
                        </Flex>
                      ) : (
                        <Text as="p">No evidence provided</Text>
                      )}
                    </DataList.Value>
                  </DataList.Item>
                </DataList.Root>
              </Flex>

              {/* Approval Status and History */}
              {selectedClaim.status !== 'pending_approval' && selectedClaim.approvalDate && <Callout.Root variant='surface'
                color={selectedClaim.status === 'approved' ? 'green' : 'red'}
                size="1" mt={'4'}>
                <Callout.Icon>
                  {selectedClaim.status === 'approved' ? <CheckCircle size={16} /> : <XCircle size={16} />}
                </Callout.Icon>
                <Callout.Text>
                  <Text as='p' size="2">
                    This task was {selectedClaim.status === 'approved' ? 'Approved' : 'Rejected'} on <strong>{formatDate(selectedClaim.approvalDate, { dateStyle: 'medium', timeStyle: 'medium' })}</strong>
                  </Text>
                </Callout.Text>
                <Text as='p' size="2" className='whitespace-pre-wrap'>
                  <strong>Feedback:</strong> {selectedClaim.feedback || 'No feedback provided'}
                </Text>
              </Callout.Root>
              }
            </div>
          )}

          <Flex gap='3' mt='4' justify='end'>
            <Dialog.Close>
              <Button variant='soft' color='gray'>
                Close
              </Button>
            </Dialog.Close>
          </Flex>
        </Dialog.Content>
      </Dialog.Root>

      {/* Reject Confirmation Modal */}
      <AlertDialog.Root open={isRejectModalOpen} onOpenChange={setIsRejectModalOpen}>
        <AlertDialog.Content maxWidth='450px'>
          <AlertDialog.Title>Provide Rejection Feedback</AlertDialog.Title>
          <AlertDialog.Description size='2'>
            Optionally provide feedback for the student regarding this task completion. This feedback will be visible to the student.
          </AlertDialog.Description>

          <Flex direction='column' gap='2' mt='3'>
            <label htmlFor='rejectFeedback'>
              <Text as='p' size={'2'} mb={'2'} weight={'medium'}>
                Feedback (Optional):
              </Text>
              <TextArea
                id='rejectFeedback'
                placeholder='Enter feedback here...'
                value={rejectFeedback}
                onChange={(e) => setRejectFeedback(e.target.value)}
                rows={3}
                resize='vertical'
              />
            </label>
          </Flex>

          <Flex gap='3' mt='4' justify='end'>
            <AlertDialog.Cancel>
              <Button variant='soft' color='gray'>
                Cancel
              </Button>
            </AlertDialog.Cancel>
            <AlertDialog.Action>
              <Button
                disabled={reviewTask.isPending && reviewTask.variables === claimToReject?._id}
                variant='solid'
                color='red'
                onClick={handleRejectConfirm}
              >
                {reviewTask.isPending && reviewTask.variables === claimToReject?._id ? "Processing..." : "Confirm Rejection"}
              </Button>
            </AlertDialog.Action>
          </Flex>
        </AlertDialog.Content>
      </AlertDialog.Root>
    </>
  );
}

export default ParentClaims;
