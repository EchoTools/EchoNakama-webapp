import type {
  ActionFunctionArgs,
  LoaderFunctionArgs,
  MetaFunction,
} from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Form, Link, useActionData, useSearchParams } from "@remix-run/react";
import { useEffect, useRef } from "react";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  String(request);
  return json({});
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData();
  let linkCode = String(formData.get("linkCode"));
  const discordCode = String(formData.get("discordCode"));
  // use environment variable SUCCESS_REDIRECT_URL
  const successRedirectUrl = process.env.SUCCESS_REDIRECT_URL ?? "/";
  
  linkCode = linkCode.toUpperCase().replace(/[^ABCDEFGHJKMNPRSTUVWXYZ]/g, '')
  if (linkCode.length != 4) {
    return json(
      { errors: { linkCode: "linkCode is invalid", discordCode: null } },
      { status: 400 },
    );
  } else if (discordCode == null) {
    return json(
      { errors: { linkCode: null, discordCode: "discord code is invalid. retry oauth." } },
      { status: 400 },
    );
  }

  const DISCORD_OAUTH2_URL = process.env.DISCORD_OAUTH2_URL ?? '';
  const API_URL = process.env.API_URL ?? '';


  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ linkCode, discordCode }),
  });

  if (response.status === 200) {
    return redirect(successRedirectUrl);
  } else if (response.status === 401) {
    return redirect(DISCORD_OAUTH2_URL);
  }
  return {  errors: { linkCode: null, discordCode: null }};
};

export const meta: MetaFunction = () => [{ title: "Link Device" }];

export default function LoginPage() {
  const [searchParams] = useSearchParams();
  const discordCode = searchParams.get("code");

  const actionData = useActionData<typeof action>();
  const linkCodeRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    if (actionData?.errors?.linkCode) {
      linkCodeRef.current?.focus();
    }

    linkCodeRef.current?.addEventListener("input", (e) => {
      const input = e.target as HTMLInputElement;
      // limit it to 4 characters
      input.value = input.value.toUpperCase().replace(/[^ABCDEFGHJKMNPRSTUVWXYZ]/g, '').slice(0, 4);
    } )
    
  }, [actionData]);

  return (
    <div className="flex min-h-full flex-col justify-center">
      <div className="mx-auto w-full max-w-md px-8 my-4">
        <Form method="post" navigate={false} className="space-y-6">
          <div>

            <input type="hidden" name="discordCode" value={discordCode ?? ''} />
            <label 
            htmlFor="linkCode"
            className="block text-center text-4xl font-bold text-gray-700">Link Account</label>
            <p id="subheader">To link your account, please enter the 4-character code displayed in your headset.</p>
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
                className="w-80 h-40 rounded border border-gray-500 px-2 py-1 text-9xl"
              />
              {actionData?.errors?.linkCode ? (
                <div className="pt-1 text-red-700" id="linkCode-error">
                  {actionData.errors.linkCode}
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
              <Link
                className="text-blue-500 underline"
                to={{
                  pathname: "/join",
                  search: searchParams.toString(),
                }}
              >
                Link Account
              </Link>
              </div>
            </div>
          </div>
        </Form>
      </div>
    </div>
  );
}
