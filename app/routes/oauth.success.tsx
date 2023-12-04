import type {
  ActionFunctionArgs,
  LoaderFunctionArgs,
  MetaFunction,
} from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Form, Link, useActionData, useLoaderData, useSearchParams } from "@remix-run/react";

import { useEffect, useRef  } from "react";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const DISCORD_OAUTH2_URL = process.env.DISCORD_OAUTH2_URL ?? '';

  String(request);

  return json({discordOauth2Url: process.env.DISCORD_OAUTH2_URL ?? ''});
};

const _sanitizeLinkCode = (linkCode: string) => {
  return linkCode.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 4);
}

export const action = async ({ request }: ActionFunctionArgs) => {
  const SUCCESS_REDIRECT_URL = process.env.SUCCESS_REDIRECT_URL ?? "/";
  const DISCORD_OAUTH2_URL = process.env.DISCORD_OAUTH2_URL ?? '';
  const NAKAMA_API_BASE_URL = process.env.NAKAMA_API_BASE_URL ?? '';
  const NAKAMA_HTTP_KEY = process.env.NAKAMA_HTTP_KEY ?? '';
  const OAUTH_REDIRECT_URL = process.env.OAUTH_REDIRECT_URL ?? '';

  const formData = await request.formData();
  let linkCode = String(formData.get("linkCode"));
  const oauthCode = String(formData.get("discordCode"));

  linkCode = _sanitizeLinkCode(linkCode);
  if (linkCode.length != 4) {
    return json(
      { success: false, errors: {   linkCode: "linkCode is invalid. Your link code is 4 letters.", discordCode: null } },
      { status: 400 },
    );
  }
  if (!oauthCode) {
    return json(
      { success: false, errors: {   linkCode: null, discordCode: "discord code is invalid. retry oauth by clicking 'Link Discord' below." } },
      { status: 400 },
    );
  }
console.log("url:", NAKAMA_API_BASE_URL + '/v2/rpc/discordLinkDevice?http_key=' + NAKAMA_HTTP_KEY)
console.log("Sending: %s", JSON.stringify(JSON.stringify({ 
  linkCode, 
  oauthCode,
  oauthRedirectUrl: OAUTH_REDIRECT_URL,
})));
  const response = await fetch(
    NAKAMA_API_BASE_URL + '/v2/rpc/discordLinkDevice?http_key=' + NAKAMA_HTTP_KEY, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(JSON.stringify({ 
      linkCode, 
      oauthCode,
      oauthRedirectUrl: OAUTH_REDIRECT_URL,
  })),
  });
  console.log("Nakama response: %s %s", response.status, response.statusText, response);

  if (response.status === 200) {
    return json(
      { success: true, errors: {   linkCode: null, discordCode: null, } },
      { status: 200 },
    );
    //return redirect(SUCCESS_REDIRECT_URL);
  } else if (response.status === 401) {
    console.error(`Redirecting to oauth url, because of error from nakama: ${response.statusText}`)
    //return redirect(DISCORD_OAUTH2_URL);
    console.error("Error: 404 ", )
    return json(
      { success: false, errors: {   linkCode: "Could not find link code or discord code expired. Try clicking 'Link Discord' below.", discordCode: null, } },
      { status: 400 },
    );
  } else if ( response.status === 404) {
    console.log("Error 404");
    return json(
      { success: false, errors: {   linkCode: "linkCode is used/expired/not found.", discordCode: null } },
      { status: 400 },
    );
  } else if ( response.status != 200) {
    console.log("Error: ", response.status, response.statusText);
    return json(
      { success: false, errors: {   linkCode: "linkCode is invalid", discordCode: null } },
      { status: 400 },
    );
  }

  return {  success: false, errors: {   linkCode: null, discordCode: null }};
};

export const meta: MetaFunction = () => [{ title: "Link Device" }];

export default function LoginPage() {

  const [searchParams] = useSearchParams();
  const discordCode = searchParams.get("code");

  const actionData = useActionData<typeof action>();
  const loaderData = useLoaderData<typeof loader>();
  const linkCodeRef = useRef<HTMLInputElement>(null);

  if (!discordCode) {
    return redirect(loaderData.discordOauth2Url);
  }
  useEffect(() => {

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
        <Form method="post" className="space-y-6">
          <div>
            <label 
            htmlFor="linkCode"
            className="block text-sm font-medium text-gray-700">Link Account</label>
            <p id="subheader">To link your account, please enter the 4-character code displayed in your headset.</p>
            <input type="hidden" name="discordCode" value={discordCode ?? ""} />
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
            Log in
          </button>
          <div className="flex items-center justify-between">
            <div className="flex items-center">

            <div className="text-center text-sm text-gray-500">
              Don&apos;t have an account?{" "}
              <a href={loaderData.discordOauth2Url} className="font-medium text-blue-600 hover:text-blue-500">
                Link Discord
              </a>
              </div>
            </div>
          </div>
        </Form>
      </div>
    </div>
  );
}
