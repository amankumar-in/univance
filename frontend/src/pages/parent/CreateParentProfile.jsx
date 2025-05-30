import { Button, Callout, Flex, Text, TextField } from '@radix-ui/themes';
import { Info } from 'lucide-react';
import React from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import { useUpdateUserProfile } from '../../api/user/user.mutations';
import { useCreateParentProfile } from '../../api/parent/parent.mutations';
import { Container, ProfilePictureUpload, VerifyMobileNumber } from '../../components';
import { useAuth } from '../../Context/AuthContext';

function calculateAge(dateString) {
  const today = new Date();
  const birthDate = new Date(dateString);
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

function CreateParentProfile() {
  const { user, setUser } = useAuth();
  const { firstName, lastName, email, phoneNumber, isPhoneVerified: isPhoneVerifiedFromUser } = user ?? {};
  const navigate = useNavigate();
  const [isPhoneVerified, setIsPhoneVerified] = React.useState(isPhoneVerifiedFromUser || false);
  const [currentPhone, setCurrentPhone] = React.useState(phoneNumber || "");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      dateOfBirth: '',
      phoneNumber: '',
    },
  });

  const {
    mutateAsync: updateUserProfile,
    isPending: isUpdatingUserProfile,
    isError: isErrorUpdatingUserProfile,
    error: errorUpdatingUserProfile,
  } = useUpdateUserProfile();

  const {
    mutateAsync: createParentProfile,
    isPending: isCreatingProfile,
    isError: isErrorCreatingProfile,
    error: errorCreatingProfile,
  } = useCreateParentProfile();

  const onSubmit = async (data) => {
    try {
      await updateUserProfile(data);
      try {
        await createParentProfile({});
        toast.success('Profile created successfully');
        setCurrentPhone(data.phoneNumber || phoneNumber);
        setUser({ ...user, phoneNumber: data.phoneNumber });
      } catch (error) {
        // error handled below
        console.error('Failed to create parent profile', error)
      }
    } catch (error) {
      // error handled below
      console.error('Failed to update user profile', error)
    }
  };

  return (
    <Container>
      {currentPhone && !isPhoneVerified ? (
        <VerifyMobileNumber
          phoneNumber={currentPhone}
          onVerified={() => {
            navigate('/parent/dashboard', { replace: true });
          }}
        />
      ) : (
        <div className="relative z-10 w-full max-w-2xl mx-auto space-y-6 text-gray-900 bg-white ">
          <div className="text-center">
            <Text as="p" size="8" weight="bold">Create Parent Profile</Text>
            <Text as="p" size="4" mt="4">Complete your parent profile to get started</Text>
          </div>
          {/* Error Message Display */}
          {(isErrorCreatingProfile || isErrorUpdatingUserProfile) && (
            <Callout.Root color="red" variant="surface">
              <Callout.Icon>
                <Info size={16} />
              </Callout.Icon>
              <Callout.Text>
                {errorCreatingProfile?.response?.data?.message ||
                  errorUpdatingUserProfile?.response?.data?.message ||
                  "Failed to create profile."}
              </Callout.Text>
            </Callout.Root>
          )}

          {/* Profile Picture Upload Component */}
          <ProfilePictureUpload />

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* First Name and Last Name */}
            <Flex gap={'4'} className='flex-col sm:flex-row'>
              <label className='flex-1'>
                <Text as="div" size="2" mb="1" weight="medium">
                  First Name
                </Text>
                <TextField.Root
                  size={"3"}
                  defaultValue={firstName}
                  radius="large"
                  placeholder="First name"
                  readOnly
                />
              </label>
              <label className='flex-1'>
                <Text as="div" size="2" mb="1" weight="medium">
                  Last Name
                </Text>
                <TextField.Root
                  readOnly
                  defaultValue={lastName}
                  size={"3"}
                  radius="large"
                  placeholder="Last Name"
                />
              </label>
            </Flex>
            {/* Email */}
            <div>
              <label>
                <Text as="div" size="2" mb="1" weight="medium">
                  Email
                </Text>
                <TextField.Root
                  size={"3"}
                  defaultValue={email}
                  radius="large"
                  placeholder="Email"
                  readOnly
                />
              </label>
            </div>
            {/* Date of birth and Phone number */}
            <Flex gap={'4'} className='flex-col sm:flex-row'>
              <div className='flex-1'>
                <label >
                  <Text as="div" size="2" mb="1" weight="medium">
                    Date of Birth {" "}
                    <Text as='span' color='gray' size='2' weight={'regular'}>
                      (optional)
                    </Text>
                  </Text>
                  <TextField.Root
                    type='date'
                    size={"3"}
                    {...register('dateOfBirth', {
                      validate: (value) => {
                        if (value) {
                          const age = calculateAge(value);
                          if (isNaN(age) || age < 0) return 'Enter a valid date';
                          return true;
                        }
                      },
                    })}
                    radius="large"
                  />
                </label>
                {errors.dateOfBirth && (
                  <Text
                    as="p"
                    size={"2"}
                    color='red'
                    className="flex items-center gap-1 mt-1"
                  >
                    <Info size={14} /> {errors.dateOfBirth.message}
                  </Text>
                )}
              </div>
              <div className='flex-1'>
                <label className='flex-1'>
                  <Text as="div" size="2" mb="1" weight="medium">
                    Phone Number
                  </Text>
                  <TextField.Root
                    type='tel'
                    size={'3'}
                    {...register('phoneNumber', {
                      required: 'Phone number is required',
                      validate: (value) => {
                        if (value && value.length < 10) return 'Phone number must be at least 10 digits';
                        return true;
                      },
                    })}
                    radius='large'
                    placeholder='Phone Number'
                  />
                </label>
                {errors.phoneNumber && (
                  <Text
                    as="p"
                    size={"2"}
                    color='red'
                    className="flex items-center gap-1 mt-1"
                  >
                    <Info size={14} /> {errors.phoneNumber.message}
                  </Text>
                )}
              </div>
            </Flex>
            {/* Submit Button */}
            <div className="text-center">
              <Button
                type="submit"
                size="4"
                className="w-full"
                disabled={isCreatingProfile || isUpdatingUserProfile}
              >
                {(isCreatingProfile || isUpdatingUserProfile) ? 'Creating...' : 'Create Profile'}
              </Button>
            </div>
          </form>
        </div>
      )}
    </Container>
  );
}

export default CreateParentProfile;
