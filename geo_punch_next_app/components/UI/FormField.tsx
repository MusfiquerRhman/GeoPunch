"use client";

import { UseFormRegister, FieldValues, Path, FieldError } from "react-hook-form";

type FormFieldProps<T extends FieldValues> = {
  label: string;
  name: Path<T>;
  register: UseFormRegister<T>;
  type?: string;
  placeholder?: string;
  autoComplete?: string;
  errors?: FieldError | string;
};

const FormField = <T extends FieldValues>({
  label,
  name,
  register,
  type = "text",
  placeholder,
  autoComplete,
  errors
}: FormFieldProps<T>) => {

  return (
    <>
      <div className="flex w-full flex-col gap-1.5">
        <label htmlFor={name} className="text-sm font-medium text-gray-700">{label}</label>
        <div className="w-full">
          <input
            id={name}
            type={type}
            placeholder={placeholder}
            autoComplete={autoComplete}
            className={`w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-gray-900 shadow-sm outline-none transition placeholder:text-gray-400 focus:border-teal-600 focus:ring-2 focus:ring-teal-100 ${errors ? 'border-red-400 focus:border-red-500 focus:ring-red-100' : 'border-gray-300'}`}
            {...register(name)}
          />
          {errors && <p className="mt-1 text-sm text-red-600">{typeof errors === "string" ? errors : errors.message}</p>}
        </div>
      </div>
    </>
  );
}


export default FormField;
