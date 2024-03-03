import { Button, Frog } from "frog";
import { handle } from "frog/vercel";
import {
  checkEligibility,
  checkRecasted,
  addPromoter,
  promotionActive,
  checkClaimed,
  sendReward,
  getAddress,
} from "./utils.js";

// Constants
const ipfsGateway = "aquamarine-creepy-gayal-340.mypinata.cloud";
const ipfsHash = "QmXzw6Zott9Eyo4MUEDMVRWVkVPh6DMRDUSadhWBVU8mBz";
const ipfsPath = `https://${ipfsGateway}/ipfs/${ipfsHash}/`;

const minFollowers = 400;

// Uncomment to use Edge Runtime.
// export const config = {
//   runtime: 'edge',
// }

type State = {
  page: number;
  promote: boolean;
};

export const app = new Frog<State>({
  basePath: "/api",
  initialState: {
    page: 0,
    promote: false,
  },
  // Supply a Hub API URL to enable frame verification.
  hubApiUrl: "https://api.hub.wevm.dev",
});

app.frame("/", async (c) => {
  const { buttonValue, deriveState, frameData, verified } = c;
  if (!verified) console.log("Frame verification failed");

  const state = deriveState((previousState) => {
    if (buttonValue === "next") previousState.page++;
    if (buttonValue === "prev") previousState.page--;
    if (buttonValue === "reset") {
      previousState.promote = false;
      previousState.page = 0;
    }
    if (buttonValue === "promote") previousState.promote = true;
  });

  let promotePage: string | null = null;
  let txHash;

  if (frameData && state.promote) {
    const { fid, castId } = frameData;
    const { hash } = castId;
    if (buttonValue === "claim") {
      const recasted = await checkRecasted(fid, hash);
      if (recasted) {
        const address = await getAddress(fid);
        txHash = await sendReward(address!);

        await addPromoter(fid);
        promotePage = "claimed";
      } else {
        promotePage = "claim-error";
      }
    } else {
      const claimed = await checkClaimed(fid);
      if (claimed) {
        promotePage = "already-claimed";
      } else {
        const active = await promotionActive();
        if (active) {
          const eligible = await checkEligibility(fid, minFollowers);
          if (eligible) {
            const address = await getAddress(fid);
            if (address) {
              promotePage = "eligible";
            } else {
              promotePage = "no-wallet";
            }
          } else {
            promotePage = "ineligible";
          }
        } else {
          promotePage = "inactive";
        }
      }
    }
  }

  return c.res({
    image:
      state.promote && promotePage !== null
        ? `${ipfsPath}/${promotePage}.png`
        : `${ipfsPath}/${state.page}.png`,
    intents: [
      !state.promote && state.page > 0 && <Button value="prev">{"<"}</Button>,
      !state.promote && state.page !== 4 && <Button value="next">{">"}</Button>,
      (state.page === 4 || state.promote) && (
        <Button value="reset">Back to start</Button>
      ),
      !state.promote && <Button value="promote">Promote and earn</Button>,
      ["eligible", "claim-error"].includes(promotePage!) && (
        <Button value="claim">Claim</Button>
      ),
      promotePage === "claimed" && txHash && (
        <Button.Link href={`https://basescan.org/tx/${txHash}`}>
          Transaction
        </Button.Link>
      ),
    ],
  });
});

export const GET = handle(app);
export const POST = handle(app);
