import { useQuery } from "@tanstack/react-query";
import { getStudentByUserId, getStudentProfile, getPendingLinkRequests, getParentLinkRequests } from "./student.api";


export const useStudentByUserId = (userId, fetchNow = false) => {
  return useQuery({
    queryKey: ["students", userId],
    queryFn: () => getStudentByUserId(userId),
    enabled: !!userId && fetchNow,
  });
};

export const useStudentProfile = () => {
  return useQuery({
    queryKey: ["students", "profile"],
    queryFn: getStudentProfile,
  });
};

export const useGetPendingLinkRequests = () => {
  return useQuery({
    queryKey: ["linkRequests", "pending"],
    queryFn: getPendingLinkRequests,
  });
};

export const useGetParentLinkRequests = () => {
  return useQuery({
    queryKey: ["linkRequests", "parent"],
    queryFn: getParentLinkRequests,
  });
};
