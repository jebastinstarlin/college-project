import API from "./api";

export const initiateCall = async (data: { phone: string; course: string; topic: string; userName?: string; userEmail?: string }) => {
  const res = await API.post("/vapi/call", {
    phoneNumber: data.phone,
    userName: data.userName || "Student",
    userEmail: data.userEmail || "",
    preferredCourse: data.course,
    queryTopic: data.topic,
  });
  return res.data;
};