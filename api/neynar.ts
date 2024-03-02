import { NeynarAPIClient, isApiErrorResponse } from "@neynar/nodejs-sdk";

const client = new NeynarAPIClient(process.env.NEYNAR_API_KEY!);

export const checkEligibility = async (fid: number, minFollowers: number) => {
  const response = await client.fetchBulkUsers([fid], {});
  const user = response.users[0];
  return user.active_status === "active" && user.follower_count >= minFollowers;
};