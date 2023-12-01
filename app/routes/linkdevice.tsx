import type {
  ActionFunctionArgs,
  LoaderFunctionArgs,
  MetaFunction,
} from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Form, Link, useActionData, useSearchParams } from "@remix-run/react";
import { useEffect, useRef } from "react";
import { safeRedirect } from "~/utils";



export const loader = async ({ request }: LoaderFunctionArgs) => {
  String(request);
  return json({});
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const linkCode = String(formData.get("linkCode"));
  const redirectTo = safeRedirect(formData.get("redirectTo"), "/");

  if (linkCode.length > 4) {
    return json(
      { errors: { linkCode: "linkCode is invalid", password: null } },
      { status: 400 },
    );
  }

  const DISCORD_OAUTH2_URL = "https://bit.ly/echovrce-link";

  return redirect(DISCORD_OAUTH2_URL);
};

export const meta: MetaFunction = () => [{ title: "Link Device" }];

export default function LoginPage() {
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") || "/notes";
  const actionData = useActionData<typeof action>();
  const linkCodeRef = useRef<HTMLInputElement>(null);
  //linkCodeRef.value = linkCodeRef.value.toUpperCase().replace(/[^ABCDEFGHJKMNPRSTUVWXYZ]/g, '');
  useEffect(() => {
    if (actionData?.errors?.linkCode) {
      linkCodeRef.current?.focus();
    }
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
