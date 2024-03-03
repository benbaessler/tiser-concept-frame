import { NeynarAPIClient } from "@neynar/nodejs-sdk";
import prisma from "./prisma.js";

const client = new NeynarAPIClient(process.env.NEYNAR_API_KEY!);

export const checkEligibility = async (fid: number, minFollowers: number) => {
  const response = await client.fetchBulkUsers([fid], {});
  const user = response.users[0];
  return user.active_status === "active" && user.follower_count >= minFollowers;
};

export const checkRecasted = async (fid: number, castHash: string) => {
  const response = await client.lookUpCastByHashOrWarpcastUrl(castHash, "hash");
  const { recasts } = response.cast.reactions;
  return recasts.some((r) => r.fid === fid);
};

export const addPromoter = async (fid: number) =>
  await prisma.promoter.create({
    data: {
      fid,
    },
  });

export const promotionActive = async () => (await prisma.promoter.count()) < 20;

export const checkClaimed = async (fid: number) => {
  const promoter = await prisma.promoter.findUnique({
    where: {
      fid,
    },
  });
  return promoter !== null;
};
