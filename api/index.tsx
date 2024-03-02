import { Button, Frog } from "frog";
import { handle } from "frog/vercel";
import { checkEligibility } from "./neynar.js";

// Constants
const ipfsGateway = "aquamarine-creepy-gayal-340.mypinata.cloud";
const ipfsHash = "QmahqxxyJLtFUxDRDELvJSWFWvWtMvXgmWnJennDwznsNb";

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
  // hubApiUrl: 'https://api.hub.wevm.dev',
});

app.frame("/", async (c) => {
  const { buttonValue, deriveState, frameData, verified } = c;
  if (!verified) console.log("Frame verification failed");

  // TODO: use frameData
  const fid = 191294;

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
    const eligible = await checkEligibility(fid, minFollowers);
    promotePage = eligible ? "eligible" : "ineligible";
  }

  return c.res({
    image:
      promotePage === "eligible" ? (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: "white",
            width: "100%",
            height: "100%",
            fontSize: "50px",
            fontWeight: "bold",
          }}
        >
          <span>You are eligible to earn</span>
        </div>
      ) : (
        `https://${ipfsGateway}/ipfs/${ipfsHash}/${state.page}.png`
      ),
    intents: [
      !state.promote && state.page > 0 && <Button value="prev">{"<"}</Button>,
      !state.promote && state.page !== 4 && <Button value="next">{">"}</Button>,
      (state.page === 4 || state.promote) && (
        <Button value="reset">Back to start</Button>
      ),
      !state.promote && <Button value="promote">Promote and earn</Button>,
      promotePage === "eligible" && <Button value="claim">Claim</Button>,
    ],
  });
});

export const GET = handle(app);
export const POST = handle(app);
