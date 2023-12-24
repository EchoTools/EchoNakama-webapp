import type {
  ActionFunctionArgs,
  LoaderFunctionArgs,
  MetaFunction,
} from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Form, Link, useActionData, useLoaderData, useSearchParams } from "@remix-run/react";

import { useEffect, useRef  } from "react";

export const loader = async ({ request }: LoaderFunctionArgs) => {
   // get the code from the url 
  const url = new URL(request.url);
  const sessionToken = url.searchParams.get("sessionToken");
  const discordUsername = url.searchParams.get("discordUsername");
  const discordAuthorizeUrl = process.env.DISCORD_AUTHORIZE_URL ?? '';
  // redirect to sign-in to discord, if the code is not given
  if (!sessionToken) {
    console.warn("No session token provided, redirecting to discord oauth");
    return redirect(process.env.DISCORD_AUTHORIZE_URL ?? '');
  }

  return { sessionToken, discordUsername, discordAuthorizeUrl }; // Contains nakama session token
};


const _sanitizeLinkCode = (linkCode: string) => {
  return linkCode.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 4);
}

export const action = async ({ request }: ActionFunctionArgs) => {
  const nakamaApiBaseUrl = process.env.NAKAMA_API_BASE_URL ?? '';
  const nakamaHttpKey = process.env.NAKAMA_HTTP_KEY ?? '';
  const discordAuthorizeUrl = process.env.DISCORD_AUTHORIZE_URL ?? '';
  const oauthRedirectUrl = process.env.DISCORD_REDIRECT_URL ?? '';
  const formData = await request.formData();
  let linkCode = String(formData.get("linkCode"));
  let  sessionToken = String(formData.get("sessionToken"));

  // validate the link code and session token
  linkCode = _sanitizeLinkCode(linkCode);
  if (linkCode.length != 4) {
    return json(
      { discordAuthorizeUrl, success: false, errors: {   linkCode: "linkCode is invalid. Your link code is 4 letters.", sessionToken: null } },
      { status: 400 },
    );
  }
  if (!sessionToken) {
    return json(
      { discordAuthorizeUrl, success: false, errors: {   linkCode: null, discordCode: "session token is invalid. retry oauth by clicking 'Link Discord' below." } },
      { status: 400 },
    );
  }

  // Send the link code and the session token (identifying the account to link to) to the nakama server
  const response = await fetch(
    nakamaApiBaseUrl + '/v2/rpc/link/device?http_key=' + nakamaHttpKey, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(JSON.stringify({ 
      linkCode,
      sessionToken,
      oauthRedirectUrl
  })),
  });
  console.log("Nakama response: %s %s", response.status, response.statusText, response);

  if (response.status === 200) {
    return json(
      { discordAuthorizeUrl, success: true, errors: {   linkCode: null, sessionToken: null, } },
      { status: 200 },
    );
    //return redirect(SUCCESS_REDIRECT_URL);
  } else if (response.status === 401) {
    console.error(`Redirecting to oauth url, because of error from Nakama: ${response.statusText}`)
    //return redirect(DISCORD_REDIRECT_URL);
    console.error("Error: 401", )
    return json(
      { discordAuthorizeUrl, success: false, errors: {   linkCode: "Could not find link code or session expired. Try clicking 'Link Discord' below.", sessionToken: null, } },
      { status: 400 },
    );
  } else if ( response.status === 404) {
    console.log("Error 404");
    return json(
      { discordAuthorizeUrl, success: false, errors: {   linkCode: "linkCode is used/expired/not found.", sessionToken: null } },
      { status: 400 },
    );
  } else if ( response.status != 200) {
    console.log("Error: ", response.status, response.statusText);
    return json(
      { discordAuthorizeUrl, success: false, errors: {   linkCode: "linkCode is invalid", sessionToken: null } },
      { status: 400 },
    );
  }

  return {  discordAuthorizeUrl, success: false, errors: {   linkCode: null, sessionToken: null }};
};

export const meta: MetaFunction = () => [{ title: "Link Device" }];


export default function LinkPage() {

  //const [searchParams] = useSearchParams();


  const actionData = useActionData<typeof action>();
  const loaderData = useLoaderData<typeof loader>();
  const linkCodeRef = useRef<HTMLInputElement>(null);

  const sessionToken = loaderData.sessionToken;
  const discordUsername = loaderData.discordUsername;
  const discordAuthorizeUrl = loaderData.discordAuthorizeUrl;

  useEffect(() => {

    // on load make a request to the nakama server to exchange the code
    
    // when the page loads, send the exchange code to the nakama server
    
    if (actionData?.errors?.linkCode) {
      linkCodeRef.current?.focus();
    }


    linkCodeRef.current?.addEventListener("input", (e) => {

      const input = e.target as HTMLInputElement;
      // limit it to 4 characters
      input.value = _sanitizeLinkCode(input.value);
    } )

    

  
  }, [actionData]);

 
  return (
    <div className="flex min-h-full flex-col justify-center">
      <div className="mx-auto w-full max-w-md px-8">
        <Form method="post" autoComplete="off" className="space-y-6">
          <div>
            <label htmlFor="linkCode" className="block text-sm font-medium text-gray-700">
            Linking to Discord User: <b><a href={discordAuthorizeUrl} className="font-medium text-blue-600 hover:text-blue-500">{discordUsername}</a></b></label><br/>
            <p id="subheader">Enter the 4-character code displayed in your headset.</p>
            <input type="hidden" name="sessionToken" value={sessionToken ?? ""} />
            <div className="mt-1">
              <input
                ref={linkCodeRef}
                id="linkInput"
                required
                // eslint-disable-next-line jsx-a11y/no-autofocus
                autoFocus={true}
                name="linkCode"
                type="text"
                autoComplete="none"
                aria-invalid={actionData?.errors?.linkCode ? true : undefined}
                aria-describedby="linkCode-error"
                className="w-full rounded border border-gray-500 px-2 py-1 text-lg"
              />
              {actionData?.errors?.linkCode ? (
                <div className="pt-1 text-red-700" id="linkCode-error">
                  {actionData.errors.linkCode}
                </div>
              ) : null}
              {actionData?.success == true ? (
                <div className="pt-1 text-green-700" id="linkCode-success">
                  ACCOUNT SUCCESSFULLY LINKED! You can now close this window and restart your EchoVR game! 
                </div>
              ) : null}
            </div>
          </div>
          <div>
          </div>
          <button
            type="submit"
            className="w-full rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 focus:bg-blue-400"
          >
            Link Headset
          </button>
          <div className="flex items-center justify-between">
            <div className="flex items-center">

            <div className="text-center text-sm text-gray-500">
   
              </div>
            </div>
          </div>
        </Form>
      </div>
    </div>
  );
}
