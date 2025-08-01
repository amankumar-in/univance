import { Badge, Box, Button, Flex, Heading, RadioGroup, Select, Separator, Text, TextArea, TextField } from '@radix-ui/themes';
import { Activity, ArrowLeft, Book, Calculator, Calendar, Crown, Droplet, Gift, Heart, Home, Medal, Microscope, Music, Pen, Plus, Rocket, School, Settings, Star, Target, ThumbsUp, Trophy } from 'lucide-react';
import React, { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Link, useNavigate, useParams } from 'react-router';
import { toast } from 'sonner';
import {
  useCreateRewardCategory,
  useDeleteRewardCategory,
  useUpdateRewardCategory
} from '../../api/rewards/rewards.mutations';
import {
  useGetRewardCategories,
  useGetRewardCategoryById
} from '../../api/rewards/rewards.queries';
import { Container, Loader } from '../../components';

// Icon mapping for reward categories
const iconMap = {
  gift: Gift,
  star: Star,
  crown: Crown,
  heart: Heart,
  medal: Medal,
  trophy: Trophy,
  target: Target,
  rocket: Rocket,
  home: Home,
  school: School,
  book: Book,
  music: Music,
  settings: Settings,
  calculator: Calculator,
  microscope: Microscope,
  pen: Pen,
  droplet: Droplet,
  'thumbs-up': ThumbsUp,
  calendar: Calendar,
  activity: Activity,
};

const CreateRewardCategory = () => {
  const navigate = useNavigate();
  const { id } = useParams(); // For editing existing category
  const isEdit = Boolean(id);

  // API hooks
  const { data: category, isLoading: isLoadingCategory } = useGetRewardCategoryById(id);
  const { data: rewardCategories } = useGetRewardCategories({ limit: 100 }); // Get all for parent selection
  const { mutate: createRewardCategory, isPending: isCreating } = useCreateRewardCategory();
  const { mutate: updateRewardCategory, isPending: isUpdating } = useUpdateRewardCategory();
  const { mutate: deleteRewardCategory, isPending: isDeleting } = useDeleteRewardCategory();

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors, isValid },
    setValue,
    reset
  } = useForm({
    defaultValues: {
      name: '',
      description: '',
      icon: 'gift',
      color: '#4285F4',
      type: '',
      subcategoryType: '',
      minPointValue: 0,
      maxPointValue: 100,
      visibility: 'private',
      displayOrder: 0,
      parentCategory: 'none',
      schoolId: '',
    },
  });

  // Watch form values
  const type = watch('type');
  const subcategoryType = watch('subcategoryType');
  const visibility = watch('visibility');
  const formData = watch();

  // Get parent categories (only top-level categories)
  const parentCategories = rewardCategories?.data?.categories?.filter(cat => !cat.parentCategory) || [];

  // Icon options with categories for filtering
  const iconPresets = [
    { value: 'gift', label: 'Gift', category: 'family' },
    { value: 'star', label: 'Star', category: 'family' },
    { value: 'crown', label: 'Crown', category: 'family' },
    { value: 'heart', label: 'Heart', category: 'family' },
    { value: 'medal', label: 'Medal', category: 'school' },
    { value: 'trophy', label: 'Trophy', category: 'school' },
    { value: 'target', label: 'Target', category: 'school' },
    { value: 'book', label: 'Book', category: 'school' },
    { value: 'calculator', label: 'Calculator', category: 'school' },
    { value: 'microscope', label: 'Microscope', category: 'school' },
    { value: 'pen', label: 'Pen', category: 'school' },
    { value: 'rocket', label: 'Rocket', category: 'sponsor' },
    { value: 'home', label: 'Home', category: 'family' },
    { value: 'school', label: 'School', category: 'school' },
    { value: 'music', label: 'Music', category: 'custom' },
    { value: 'droplet', label: 'Droplet', category: 'custom' },
    { value: 'thumbs-up', label: 'Thumbs Up', category: 'custom' },
    { value: 'calendar', label: 'Calendar', category: 'custom' },
    { value: 'activity', label: 'Activity', category: 'custom' },
    { value: 'settings', label: 'Settings', category: 'custom' },
  ];

  // Color options with categories for filtering
  const colorPresets = [
    { color: '#4285F4', name: 'Blue', category: 'family' },
    { color: '#34A853', name: 'Green', category: 'family' },
    { color: '#FBBC05', name: 'Yellow', category: 'school' },
    { color: '#EA4335', name: 'Red', category: 'school' },
    { color: '#9B59B6', name: 'Purple', category: 'sponsor' },
    { color: '#E91E63', name: 'Pink', category: 'family' },
    { color: '#FF9800', name: 'Orange', category: 'sponsor' },
    { color: '#607D8B', name: 'Blue Gray', category: 'custom' },
    { color: '#8E44AD', name: 'Deep Purple', category: 'sponsor' },
    { color: '#2ECC71', name: 'Emerald', category: 'custom' },
  ];

  // Type options - matching backend model
  const typeOptions = [
    { value: 'family', label: 'Family', description: 'Rewards from family members' },
    { value: 'school', label: 'School', description: 'School-based rewards' },
    { value: 'sponsor', label: 'Sponsor', description: 'External sponsor rewards' },
    { value: 'custom', label: 'Custom', description: 'Custom category type' },
  ];

  // Subcategory options - matching backend model
  const subcategoryOptions = [
    { value: 'privilege', label: 'Privilege', description: 'Special privileges or permissions' },
    { value: 'item', label: 'Item', description: 'Physical or digital items' },
    { value: 'experience', label: 'Experience', description: 'Special experiences or activities' },
    { value: 'digital', label: 'Digital', description: 'Digital content or services' },
    { value: 'custom', label: 'Custom', description: 'Custom subcategory' },
  ];

  // Load existing category for editing
  useEffect(() => {
    if (isEdit && category?.data) {
      const categoryData = category.data;
      reset({
        name: categoryData.name || '',
        description: categoryData.description || '',
        icon: categoryData.icon || 'gift',
        color: categoryData.color || '#4285F4',
        type: categoryData.type || '',
        subcategoryType: categoryData.subcategoryType || '',
        minPointValue: categoryData.minPointValue || 0,
        maxPointValue: categoryData.maxPointValue || 100,
        visibility: categoryData.visibility || 'private',
        displayOrder: categoryData.displayOrder || 0,
        parentCategory: categoryData.parentCategory?._id || 'none',
        schoolId: categoryData.schoolId || '',
      });

      setTimeout(() => {
        setValue('name', categoryData.name);
        setValue('description', categoryData.description);
        setValue('icon', categoryData.icon);
        setValue('color', categoryData.color);
        setValue('type', categoryData.type);
        setValue('subcategoryType', categoryData.subcategoryType);
        setValue('parentCategory', categoryData.parentCategory?._id || 'none');
      }, 0);

    }
  }, [isEdit, category, reset]);

  // Auto-suggest point values based on type and subcategory
  useEffect(() => {
    if (type && subcategoryType && !isEdit) {
      let suggestedMin = 1;
      let suggestedMax = 100;

      // Suggest values based on type and subcategory
      if (type === 'family') {
        if (subcategoryType === 'privilege') {
          suggestedMin = 10;
          suggestedMax = 100;
        } else if (subcategoryType === 'item') {
          suggestedMin = 50;
          suggestedMax = 500;
        } else if (subcategoryType === 'experience') {
          suggestedMin = 100;
          suggestedMax = 1000;
        }
      } else if (type === 'school') {
        if (subcategoryType === 'privilege') {
          suggestedMin = 20;
          suggestedMax = 150;
        } else if (subcategoryType === 'item') {
          suggestedMin = 30;
          suggestedMax = 200;
        }
      } else if (type === 'sponsor') {
        suggestedMin = 100;
        suggestedMax = 1000;
      }

      setValue('minPointValue', suggestedMin);
      setValue('maxPointValue', suggestedMax);
    }
  }, [type, subcategoryType, setValue, isEdit]);

  // Helper function to render icons
  const renderIcon = (iconName, size = 20) => {
    const IconComponent = iconMap[iconName];
    return IconComponent ? <IconComponent size={size} /> : <Gift size={size} />;
  };

  // Filter icons and colors based on selected type
  const filteredIcons = iconPresets.filter(icon =>
    formData.type === 'custom' || icon.category === formData.type || icon.category === 'custom'
  );

  const filteredColors = colorPresets.filter(color =>
    formData.type === 'custom' || color.category === formData.type || color.category === 'custom'
  );

  const onSubmit = async (data) => {
    try {
      // Prepare submission data
      const submitData = {
        ...data,
        parentCategory: data.parentCategory === 'none' || !data.parentCategory ? null : data.parentCategory,
        minPointValue: data.minPointValue ? parseInt(data.minPointValue) : undefined,
        maxPointValue: data.maxPointValue ? parseInt(data.maxPointValue) : undefined,
        displayOrder: data.displayOrder ? parseInt(data.displayOrder) : 0,
      };

      // Remove empty fields
      Object.keys(submitData).forEach(key => {
        if (submitData[key] === '' || submitData[key] === undefined) {
          delete submitData[key];
        }
      });

      if (isEdit) {
        updateRewardCategory({ id, data: submitData }, {
          onSuccess: () => {
            toast.success('Category updated successfully');
            navigate('/platform-admin/dashboard/reward-categories');
          },
          onError: (error) => {
            toast.error(error?.response?.data?.message || error?.message || 'Failed to update category');
          }
        });
      } else {
        createRewardCategory(submitData, {
          onSuccess: () => {
            toast.success('Category created successfully');
            navigate('/platform-admin/dashboard/reward-categories');
          },
          onError: (error) => {
            toast.error(error?.response?.data?.message || error?.message || 'Failed to create category');
          }
        });
      }
    } catch (error) {
      toast.error(isEdit ? 'Failed to update category' : 'Failed to create category');
    }
  };

  if (isLoadingCategory) {
    return (
      <Container>
        <Flex justify="center">
          <Loader />
        </Flex>
      </Container>
    );
  }

  return (
    <Container>
      <div className="pb-8 space-y-8">
        {/* Header */}
        <Box>
          <Button
            variant="ghost"
            color="gray"
            asChild
            size="2"
            className="mb-4"
          >
            <Link to={'/platform-admin/dashboard/reward-categories'}>
              <ArrowLeft size={16} /> Back to Categories
            </Link>
          </Button>
          <Flex justify={'between'} align={'start'} wrap='wrap' gap='2'>
            <Flex direction={'column'}>
              <Heading as="h1" size="6" weight="medium">
                {isEdit ? 'Edit Reward Category' : 'Create New Reward Category'}
              </Heading>
              <Text color="gray" size="2" className="mt-1">
                {isEdit ? 'Update the reward category details' : 'Create a new category to organize rewards'}
              </Text>
            </Flex>

            <Flex gap='2' align='center' wrap='wrap'>
              {/* Submit Button */}
              <Button
                type="submit"
                color="grass"
                onClick={handleSubmit(onSubmit)}
                disabled={isCreating || isUpdating}
              >
                <Plus size={16} /> {isEdit ? 'Update Category' : 'Create Category'}
              </Button>
            </Flex>
          </Flex>
        </Box>

        <Text as="p" size="1" color="gray" className='italic'>
          * Required fields
        </Text>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="max-w-4xl space-y-10">
          {/* Basic Information */}
          <FormSection title="Basic Information">
            <div className="grid grid-cols-1 gap-6">
              {/* Name */}
              <div>
                <Text as="label" size="2" weight="medium" htmlFor="name">
                  Category Name *
                </Text>
                <TextField.Root
                  id="name"
                  placeholder="Enter category name"
                  {...register('name', {
                    required: 'Category name is required',
                    minLength: { value: 2, message: 'Name must be at least 2 characters' }
                  })}
                  className="mt-2"
                />
                {errors.name && (
                  <Text size="1" color="red" className="mt-1">
                    {errors.name.message}
                  </Text>
                )}
              </div>

              {/* Description */}
              <div>
                <Text as="label" size="2" weight="medium" htmlFor="description">
                  Description
                </Text>
                <TextArea
                  id="description"
                  placeholder="Describe this category"
                  {...register('description')}
                  className="mt-2"
                  rows={3}
                />
              </div>
            </div>
          </FormSection>

          {/* Category Classification */}
          <FormSection title="Classification">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {/* Type */}
              <div>
                <Text as="label" size="2" weight="medium">
                  Category Type *
                </Text>
                <Controller
                  name="type"
                  control={control}
                  rules={{ required: 'Category type is required' }}
                  render={({ field }) => (
                    <Select.Root
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <Select.Trigger placeholder="Select type" className="w-full mt-2" />
                      <Select.Content variant='soft' position='popper'>
                        {typeOptions.map((type) => (
                          <Select.Item key={type.value} value={type.value}>
                            {type.label}
                          </Select.Item>
                        ))}
                      </Select.Content>
                    </Select.Root>
                  )}
                />
                {errors.type && (
                  <Text size="1" color="red" className="mt-1">
                    {errors.type.message}
                  </Text>
                )}
              </div>

              {/* Subcategory */}
              <div>
                <Text as="label" size="2" weight="medium">
                  Subcategory Type
                </Text>
                <Controller
                  name="subcategoryType"
                  control={control}
                  render={({ field }) => (
                    <Select.Root
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <Select.Trigger placeholder="Select subcategory" className="w-full mt-2" />
                      <Select.Content variant='soft' position='popper'>
                        {subcategoryOptions.map((subcategory) => (
                          <Select.Item key={subcategory.value} value={subcategory.value}>
                            {subcategory.label}
                          </Select.Item>
                        ))}
                      </Select.Content>
                    </Select.Root>
                  )}
                />
              </div>
            </div>
          </FormSection>

          {/* Visual Design */}
          <FormSection title="Visual Design">
            <div className="space-y-6">
              {/* Icon Selection */}
              <div>
                <Text as="label" size="2" weight="medium" className="block mb-2">
                  Icon *
                </Text>
                <Controller
                  name="icon"
                  control={control}
                  rules={{ required: 'Icon is required' }}
                  render={({ field }) => (
                    <Flex gap="2" wrap="wrap">
                      {filteredIcons.map(icon => (
                        <button
                          key={icon.value}
                          type="button"
                          onClick={() => field.onChange(icon.value)}
                          style={{
                            padding: '8px',
                            backgroundColor: field.value === icon.value ? 'var(--accent-3)' : 'var(--gray-2)',
                            border: field.value === icon.value ? '1px solid var(--accent-9)' : '1px solid var(--gray-6)',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '4px',
                            minWidth: '60px'
                          }}
                        >
                          {renderIcon(icon.value, 20)}
                          <Text size="1">{icon.label}</Text>
                        </button>
                      ))}
                    </Flex>
                  )}
                />
                {errors.icon && (
                  <Text size="1" color="red" className="mt-1">
                    {errors.icon.message}
                  </Text>
                )}
                <Text size="1" color="gray" className="mt-1">
                  Pick an icon to visually represent this category.
                </Text>
              </div>

              {/* Color Selection */}
              <div>
                <Text as="label" size="2" weight="medium" className="block mb-2">
                  Color *
                </Text>
                <Controller
                  name="color"
                  control={control}
                  rules={{ required: 'Color is required' }}
                  render={({ field }) => (
                    <Flex gap="2" align="center" wrap="wrap">
                      <input
                        type="color"
                        value={field.value}
                        onChange={(e) => field.onChange(e.target.value)}
                        style={{
                          width: '40px',
                          height: '40px',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer'
                        }}
                      />
                      {filteredColors.map(color => (
                        <button
                          key={color.color}
                          type="button"
                          onClick={() => field.onChange(color.color)}
                          style={{
                            width: '32px',
                            height: '32px',
                            backgroundColor: color.color,
                            border: field.value === color.color ? '3px solid var(--accent-9)' : '1px solid var(--gray-6)',
                            borderRadius: '6px',
                            cursor: 'pointer'
                          }}
                          title={color.name}
                        />
                      ))}
                    </Flex>
                  )}
                />
                {errors.color && (
                  <Text size="1" color="red" className="mt-1">
                    {errors.color.message}
                  </Text>
                )}
                <Text size="1" color="gray" className="mt-1">
                  Choose a color for the category icon background.
                </Text>
              </div>
            </div>

            {/* Preview */}
            {watch('name') && (
              <div className="p-4 bg-[--gray-2] rounded-md">
                <Text size="2" weight="medium" className="block mb-3">
                  Preview
                </Text>
                <Flex align="center" gap="3">
                  <div
                    className="flex items-center justify-center w-10 h-10 text-white rounded-lg"
                    style={{ backgroundColor: watch('color') }}
                  >
                    {renderIcon(watch('icon'), 20)}
                  </div>
                  <div>
                    <Text weight="medium" size="3">{watch('name')}</Text>
                    {watch('description') && (
                      <Text size="2" color="gray" className="block">
                        {watch('description')}
                      </Text>
                    )}
                    <Flex gap="2" className="mt-1">
                      {watch('type') && (
                        <Badge color="blue" variant="soft" size="1">
                          {watch('type')}
                        </Badge>
                      )}
                      {watch('subcategoryType') && (
                        <Badge color="gray" variant="outline" size="1">
                          {watch('subcategoryType')}
                        </Badge>
                      )}
                    </Flex>
                  </div>
                </Flex>
              </div>
            )}
          </FormSection>

          {/* Point Value Settings */}
          <FormSection title="Point Value Guidelines">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <Text as="label" size="2" weight="medium" htmlFor="minPointValue">
                  Minimum Point Value
                </Text>
                <TextField.Root
                  id="minPointValue"
                  type="number"
                  placeholder="0"
                  {...register('minPointValue', {
                    min: { value: 0, message: 'Minimum value cannot be negative' }
                  })}
                  className="mt-2"
                />
                {errors.minPointValue && (
                  <Text size="1" color="red" className="mt-1">
                    {errors.minPointValue.message}
                  </Text>
                )}
              </div>

              <div>
                <Text as="label" size="2" weight="medium" htmlFor="maxPointValue">
                  Maximum Point Value
                </Text>
                <TextField.Root
                  id="maxPointValue"
                  type="number"
                  placeholder="100"
                  {...register('maxPointValue', {
                    min: { value: 1, message: 'Maximum value must be at least 1' }
                  })}
                  className="mt-2"
                />
                {errors.maxPointValue && (
                  <Text size="1" color="red" className="mt-1">
                    {errors.maxPointValue.message}
                  </Text>
                )}
              </div>
            </div>
            <Text size="1" color="gray">
              These values provide guidance for reward creators when setting point costs
            </Text>
          </FormSection>

          {/* Access & Visibility */}
          <FormSection title="Access & Visibility">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {/* Visibility */}
              <div>
                <Text as="label" size="2" weight="medium">
                  Visibility *
                </Text>
                <Controller
                  name="visibility"
                  control={control}
                  rules={{ required: 'Visibility is required' }}
                  render={({ field }) => (
                    <RadioGroup.Root
                      value={field.value}
                      onValueChange={field.onChange}
                      className="mt-2"
                    >
                      <div className="space-y-3">
                        <Flex align="center" gap="2">
                          <RadioGroup.Item value="private" id="private" />
                          <div>
                            <Text as="label" htmlFor="private" size="2" weight="medium">
                              Private
                            </Text>
                            <Text size="1" color="gray" className="block">
                              Only visible to you
                            </Text>
                          </div>
                        </Flex>
                        <Flex align="center" gap="2">
                          <RadioGroup.Item value="school" id="school" />
                          <div>
                            <Text as="label" htmlFor="school" size="2" weight="medium">
                              School
                            </Text>
                            <Text size="1" color="gray" className="block">
                              Visible to school members
                            </Text>
                          </div>
                        </Flex>
                        <Flex align="center" gap="2">
                          <RadioGroup.Item value="public" id="public" />
                          <div>
                            <Text as="label" htmlFor="public" size="2" weight="medium">
                              Public
                            </Text>
                            <Text size="1" color="gray" className="block">
                              Visible to everyone
                            </Text>
                          </div>
                        </Flex>
                      </div>
                    </RadioGroup.Root>
                  )}
                />
                {errors.visibility && (
                  <Text size="1" color="red" className="mt-1">
                    {errors.visibility.message}
                  </Text>
                )}
              </div>

              {/* Additional Settings */}
              <div className="space-y-4">
                {/* Display Order */}
                <div>
                  <Text as="label" size="2" weight="medium" htmlFor="displayOrder">
                    Display Order
                  </Text>
                  <TextField.Root
                    id="displayOrder"
                    type="number"
                    placeholder="0"
                    {...register('displayOrder')}
                    className="mt-2"
                  />
                  <Text size="1" color="gray" className="mt-1">
                    Lower numbers appear first
                  </Text>
                </div>

                {/* School ID (conditional) */}
                {(visibility === 'school' || type === 'school') && (
                  <div>
                    <Text as="label" size="2" weight="medium" htmlFor="schoolId">
                      School ID
                    </Text>
                    <TextField.Root
                      id="schoolId"
                      placeholder="Enter school ID"
                      {...register('schoolId')}
                      className="mt-2"
                    />
                  </div>
                )}
              </div>
            </div>
          </FormSection>

          {/* Parent Category (Optional) */}
          <FormSection title="Hierarchy (Optional)">
            <div>
              <Text as="label" size="2" weight="medium">
                Parent Category
              </Text>
              <Controller
                name="parentCategory"
                control={control}
                render={({ field }) => (
                  <Select.Root
                    value={field.value}
                    onValueChange={field.onChange}
                  >
                    <Select.Trigger placeholder="Select parent category (optional)" className="w-full mt-2" />
                    <Select.Content variant='soft' position='popper'>
                      <Select.Item value="none">No parent category</Select.Item>
                      {parentCategories.map((category) => (
                        <Select.Item key={category._id} value={category._id}>
                          <Flex align="center" gap="2">
                            <span>{renderIcon(category.icon, 16)}</span>
                            <Text>{category.name}</Text>
                            <Badge color="gray" size="1">{category.type}</Badge>
                          </Flex>
                        </Select.Item>
                      ))}
                    </Select.Content>
                  </Select.Root>
                )}
              />
              <Text size="1" color="gray" className="mt-1">
                Create a subcategory by selecting a parent category
              </Text>
            </div>
          </FormSection>
        </form>
      </div>
    </Container>
  );
};

// Helper component for form sections
export const FormSection = ({ title, children }) => {
  return (
    <div className="space-y-4">
      <div>
        <Heading as="h3" size="4" weight="medium" className="text-[--gray-12]">
          {title}
        </Heading>
        <Separator size="4" className="mt-2" />
      </div>
      {children}
    </div>
  );
};

export default CreateRewardCategory; 