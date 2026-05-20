import React from "react";

export default function ApiError({ description }: { description?: string }) {
  return (
    <div className="absolute left-1/2 top-1/2 translate-x-[-50%]  translate-y-[-50%]">
      <div className="text-3xl text-mainTheme font-[600] mb-2">
        Wystąpił błąd...
      </div>
      <div className="text-mainTheme mb-2">{description}</div>
      <div className="text-[#666]">
        Spróbuj ponownie później, jeśli problem dalej
        <br />
        będzie występował skontaktuj się z developerem
      </div>
    </div>
  );
}
