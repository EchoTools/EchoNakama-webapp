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

  return new Response(null, {
    status: 303,
    headers: {
      Location: DISCORD_OAUTH2_URL
    },
  });
};


export const action = async ({ request }: ActionFunctionArgs) => {
  
};

export const meta: MetaFunction = () => [{ title: "Link Device" }];

export default function LoginPage() {

  const [searchParams] = useSearchParams();
  const exchangeCode = searchParams.get("code");

  const actionData = useActionData<typeof action>();
  const loaderData = useLoaderData<typeof loader>();
  
  useEffect(() => {


  
  }, [actionData]);

 
  return (
    <div className="flex min-h-full flex-col justify-center">
      <div className="mx-auto w-full max-w-md px-8">

      </div>
    </div>
  );
}
