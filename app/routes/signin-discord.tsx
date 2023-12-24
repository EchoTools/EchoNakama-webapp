import type {
  ActionFunctionArgs,
  LoaderFunctionArgs,
  MetaFunction,
} from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Form, Link, useActionData, useLoaderData, useSearchParams } from "@remix-run/react";
import { log } from "node:console";
import { on } from "node:events";
import { useEffect, useRef  } from "react";

export const loader = async ({ request }: LoaderFunctionArgs) => {
   // get the code from the url 
  const url = new URL(request.url);
  const code = url.searchParams.get("code");

  
  // redirect to sign-in to discord, if the code is not given
  if (!code) {
    console.warn("No code given, redirecting to discord oauth");
    return redirect(process.env.DISCORD_AUTHORIZE_URL ?? '');
  }

  var payload = JSON.stringify(JSON.stringify({ code, 'oauth_redirect_url': process.env.DISCORD_REDIRECT_URL }));

  var response = await fetch(process.env.NAKAMA_API_BASE_URL + '/v2/rpc/signin/discord?http_key=' + process.env.NAKAMA_HTTP_KEY, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    // Nakama uses protocol buffers and 
    // gRPC, which requires an escaped JSON object
    body: payload,
  });
  if (!response.ok) {
    console.warn("Error exchanging discord code for nakama session token: ", response.status, response.statusText);
    return { redirectUrl: process.env.DISCORD_AUTHORIZE_URL ?? '' }
  }
  
  const json = JSON.parse((await response.json()).payload)
    console.log(json);
    console.info("Successfully exchanged discord code for nakama session token: ", response.status, response.statusText)

  // encode the json to url param
  const params = new URLSearchParams();
  params.append("sessionToken", json.sessionToken);
  params.append("discordUsername", json.discordUsername);



  return redirect( process.env.LINK_PAGE_URL + "?" + params.toString());

  return json; // Contains nakama session token
};


export const action = async ({ request }: ActionFunctionArgs) => {
  const loaderData = useLoaderData<typeof loader>();
  if (loaderData.redirectUrl) {
    return redirect(loaderData.redirectUrl);
  }
  return null;
};



export default function SigninDiscordPage() {


  const actionData = useActionData<typeof action>();
  const loaderData = useLoaderData<typeof loader>();



  useEffect(() => {

  }, [actionData]);

 
  return (
    <div className="flex min-h-full flex-col justify-center">
    </div>
  );
}
