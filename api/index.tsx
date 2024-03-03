import { Button, Frog } from "frog";
import { handle } from "frog/vercel";
import {
  checkEligibility,
  checkRecasted,
  addPromoter,
  promotionActive,
  checkClaimed,
} from "./utils.js";

// Constants
const ipfsGateway = "aquamarine-creepy-gayal-340.mypinata.cloud";
const ipfsHash = "QmUFr1C8isq9rGHNkgkNErK9pQ4auKnYeBVnpvXcB37m7L";
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
  if (frameData && state.promote) {
    const { fid, castId } = frameData;
    // const { hash } = castId;
    // const hash = "0x9288c1e862aa72bd69d0e383a28b9a76b63cbdb4" // not recasted
    const hash = "0x26e5084d3b7ad515ba9366e4b8dff520ef6a38f2"; // recasted
    if (buttonValue === "claim") {
      const recasted = await checkRecasted(fid, hash);
      if (recasted) {
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
          promotePage = eligible ? "eligible" : "ineligible";
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
    ],
  });
});

export const GET = handle(app);
export const POST = handle(app);
