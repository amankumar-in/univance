import { Badge, Box, Button, Callout, Card, Flex, Grid, Separator, Skeleton, Text } from '@radix-ui/themes';
import { Edit, Globe, Info, Mail, MapPin, Phone, School } from 'lucide-react';
import React from 'react';
import { Link } from 'react-router';
import { useGetSchoolProfile } from '../../api/school-admin/school.queries';
import { EmptyStateCard, Loader } from '../../components';
import PageHeader from './components/PageHeader';
import { useAuth } from '../../Context/AuthContext';
import NoSchoolProfileCard from './components/NoSchoolProfileCard';
import { FALLBACK_IMAGES } from '../../utils/constants';

function SchoolProfile() {
  const { profiles } = useAuth();
  const school = profiles?.school;
  // Queries
  const { data: schoolProfile, isLoading, error, isError } = useGetSchoolProfile({
    enabled: !!school?._id
  });
  // Extract school data from API response
  const schoolData = schoolProfile?.success ? schoolProfile.data : null;

  // Format full address
  const fullAddress = schoolData ? [
    schoolData.address,
    schoolData.city,
    schoolData.state,
    schoolData.zipCode,
    schoolData.country
  ].filter(Boolean).join(', ') : '';

  // No school profile
  if (!school) {
    return (
      <NoSchoolProfileCard description='Create a school profile to get started'>
        <SchoolProfileHeader loading={false} />
      </NoSchoolProfileCard>
    )
  }

  // Loading state
  if (isLoading) {
    return (
      <div className='mx-auto space-y-6 max-w-3xl'>
        <SchoolProfileHeader loading={isLoading} />
        <Flex justify="center" align="center">
          <Loader />
        </Flex>
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <div className='mx-auto space-y-6 max-w-3xl'>
        <SchoolProfileHeader hideButton />
        <Callout.Root color="red" variant="surface">
          <Callout.Icon>
            <Info size={16} />
          </Callout.Icon>
          <Callout.Text>
            {error?.response?.data?.message || 'Failed to load school profile. Please try again.'}
          </Callout.Text>
        </Callout.Root>
      </div>
    );
  }

  // Main return
  return (
    <Box className="mx-auto space-y-6 max-w-3xl">
      {/* Header */}
      <SchoolProfileHeader schoolData={schoolData} />

      {/* Main Profile Card */}
      {schoolData ? (
        <Card size={'3'} className='shadow-md'>
          <Flex direction="column" gap="4">
            {/* School Header */}
            <Flex className='flex-col' gap="4">
              <img
                src={schoolData.logo || FALLBACK_IMAGES.photo}
                alt={schoolData.name || 'School logo'}
                onError={(e) => {
                  e.currentTarget.src = FALLBACK_IMAGES.photo;
                }}
                className='object-cover object-center mx-auto w-full max-w-sm rounded-lg aspect-video bg-[--gray-5]'
              />
              <Box className='text-center'>
                <Text as="h2" size="5" weight="bold">
                  {schoolData.name}
                </Text>
                <Text as="p" color="gray" mt="1">
                  Educational Institution
                </Text>
              </Box>
            </Flex>

            <Separator size="4" />

            {/* Contact Information */}
            <Box>
              <Text as="p" weight="bold" mb='5'>
                Contact Information
              </Text>
              <Grid columns={{ initial: '1', md: '2' }} gap="4">
                {/* Address */}
                {fullAddress && (
                  <Flex align="start" gap="3">
                    <MapPin size={18} className='shrink-0' color='gray' />
                    <Box>
                      <Text as="p" size="3" weight="medium" className='leading-none' mb='2'>Address</Text>
                      <Text as="p" size="2">{fullAddress}</Text>
                    </Box>
                  </Flex>
                )}

                {/* Phone */}
                {schoolData.phone && (
                  <Flex align="start" gap="3">
                    <Phone size={18} className='shrink-0' color='gray' />
                    <Box>
                      <Text as="p" size="3" weight="medium" className='leading-none' mb='2'>Phone</Text>
                      <Text as="p" size="2">{schoolData.phone}</Text>
                    </Box>
                  </Flex>
                )}

                {/* Email */}
                {schoolData.email && (
                  <Flex align="start" gap="3">
                    <Mail size={18} className='shrink-0' color='gray' />
                    <Box>
                      <Text as="p" size="3" weight="medium" className='leading-none' mb='2'>Email</Text>
                      <Text as="p" size="2">{schoolData.email}</Text>
                    </Box>
                  </Flex>
                )}

                {/* Website */}
                {schoolData.website && (
                  <Flex align="start" gap="3">
                    <Globe size={18} className='shrink-0' color='gray' />
                    <Box>
                      <Text as="p" size="3" weight="medium" className='leading-none' mb='2'>Website</Text>
                      <a href={schoolData.website} target='_blank' rel='noopener noreferrer'>
                        <Text as="p" size="2" color="blue" className="cursor-pointer hover:underline">
                          {schoolData.website}
                        </Text>
                      </a>
                    </Box>
                  </Flex>
                )}
              </Grid>
            </Box>
          </Flex>
        </Card>
      ) : (
        // Empty State Card
        <EmptyStateCard
          title='No school profile found'
          description='Create a school profile to get started'
          icon={<School />}
          action={
            <Button asChild>
              <Link to="/school-admin/school/create">
                <Edit size={16} />
                Create School Profile
              </Link>
            </Button>
          }
        />
      )}
    </Box>
  );
}

export default SchoolProfile;

// School Profile Header
function SchoolProfileHeader({ schoolData, loading = false, hideButton = false }) {
  return (
    <PageHeader
      title="School Profile"
      description="Manage your school information and settings"
    >
      {!hideButton && <EditCreateProfileButton schoolData={schoolData} loading={loading} />}
    </PageHeader>
  )
}

// Edit Profile Button
function EditCreateProfileButton({ schoolData, loading }) {
  return (
    <Skeleton loading={loading} >
      <Button asChild className='shadow-md'>
        <Link to={schoolData ? "/school-admin/school/edit" : "/school-admin/school/create"}>
          <Edit size={16} />
          {schoolData ? 'Edit Profile' : 'Create Profile'}
        </Link>
      </Button>
    </Skeleton>
  )
}