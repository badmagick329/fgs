"use server";

type RegisterStudentReturn = Promise<
  | {
      ok: true;
    }
  | {
      ok: false;
      message: string;
      errors: Error[];
    }
>;

export async function registerStudent({
  firstName,
  lastName,
}: {
  firstName: string;
  lastName: string;
}): RegisterStudentReturn {
  console.log(firstName, lastName);

  // simulating delay to ensure client side state changes
  await sleep(1000);

  if (firstName.trim().toLocaleLowerCase() === "error") {
    return {
      ok: false,
      message: "Fake error message",
      errors: [new Error('First name cannot be "error"')],
    };
  }

  return { ok: true };
}

const sleep = async (ms: number) => new Promise((r) => setTimeout(r, ms));
