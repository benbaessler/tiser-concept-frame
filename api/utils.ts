import { privateKeyToAccount } from "viem/accounts";
import { createPublicClient, createWalletClient, http } from "viem";
import { base } from "viem/chains";
import ERC20_ABI from "./abi.js";

import { NeynarAPIClient } from "@neynar/nodejs-sdk";
import prisma from "./prisma.js";

const account = privateKeyToAccount(process.env.PRIVATE_KEY! as `0x${string}`);
const publicClient = createPublicClient({
  chain: base,
  transport: http(),
});

const walletClient = createWalletClient({
  chain: base,
  transport: http(),
  account,
});

const client = new NeynarAPIClient(process.env.NEYNAR_API_KEY!);

export const sendReward = async (address: string) => {
  const { request } = await publicClient.simulateContract({
    address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
    abi: ERC20_ABI,
    functionName: "transfer",
    args: [address, 100],
    account,
  });
  const txHash = await walletClient.writeContract(request);
  return txHash;
};

export const getAddress = async (fid: number) => {
  const response = await client.fetchBulkUsers([fid], {});
  const addresses = response.users[0].verifications;
  return addresses.find((a) => a.startsWith("0x")) ?? null;
};

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
