import { Button, Frog } from "frog";
import { handle } from "frog/vercel";

// Uncomment to use Edge Runtime.
// export const config = {
//   runtime: 'edge',
// }

type State = {
  page: number;
  promote: string | null;
};

const ipfsGateway = "aquamarine-creepy-gayal-340.mypinata.cloud";
const ipfsHash = "QmahqxxyJLtFUxDRDELvJSWFWvWtMvXgmWnJennDwznsNb";

export const app = new Frog<State>({
  basePath: "/api",
  initialState: {
    page: 0,
    promote: null,
  },
  // Supply a Hub API URL to enable frame verification.
  // hubApiUrl: 'https://api.hub.wevm.dev',
});

app.frame("/", (c) => {
  const { buttonValue, deriveState, frameData, verified } = c;
  if (!verified) console.log("Frame verification failed");

  const buttons = {
    prev: <Button value="prev">{"<"}</Button>,
    next: <Button value="next">{">"}</Button>,
    reset: <Button value="reset">Back to start</Button>,
    promote: <Button value="promote">Promote and earn</Button>,
  };

  let intents;

  const state = deriveState((previousState) => {
    if (buttonValue === "next") previousState.page++;
    if (buttonValue === "prev") previousState.page--;
    if (buttonValue === "reset") previousState.page = 0;

    if (buttonValue === "promote") previousState.promote = "eligible";

    if (previousState.page === 0) intents = [buttons.next, buttons.promote];
    else if (previousState.page === 4)
      intents = [buttons.prev, buttons.reset, buttons.promote];
    else intents = [buttons.prev, buttons.next, buttons.promote];
  });

  return c.res({
    image:
      state.promote === "eligible" ? (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: "white",
            width: "100%",
            height: "100%",
            fontSize: "50px",
            fontWeight: "bold"
          }}
        >
          <span>You are eligible to earn</span>
        </div>
      ) : (
        `https://${ipfsGateway}/ipfs/${ipfsHash}/${state.page}.png`
      ),
    intents,
  });
});

export const GET = handle(app);
export const POST = handle(app);
