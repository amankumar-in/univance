import { getDayAttendance, getMonthAttendance, getWeekAttendance } from "./classAttendance.api"
import { keepPreviousData, useQuery } from '@tanstack/react-query'

const useGetMonthAttendance = (classId, month, year) => {
  return useQuery({
    queryKey: ['class-attendance', 'month', classId, month, year],
    queryFn: () => getMonthAttendance(classId, month, year),
    placeholderData: keepPreviousData
  })
}

const useGetDayAttendance = (classId, date) => {
  return useQuery({
    queryKey: ['class-attendance', 'day', classId, date],
    queryFn: () => getDayAttendance(classId, date),
    placeholderData: keepPreviousData
  })
}

const useGetWeekAttendance = (classId, startDate) => {
  return useQuery({
    queryKey: ['class-attendance', 'week', classId, startDate],
    queryFn: () => getWeekAttendance(classId, startDate),
    placeholderData: keepPreviousData
  })
}

export {
  useGetMonthAttendance,
  useGetDayAttendance,
  useGetWeekAttendance,
}