"use client";

import { UseFormRegister, FieldValues, Path } from "react-hook-form";

type FormFieldProps<T extends FieldValues> = {
  label: string;
  name: Path<T>;
  register: UseFormRegister<T>;
  type?: string;
  placeholder?: string;
};

const FormField = <T extends FieldValues>({
  label,
  name,
  register,
  type = "text",
  placeholder,
}: FormFieldProps<T>) => {
  return (
    <div className="flex w-full">
      <label className="font-medium flex-1">{label}</label>
      <input
        type={type}
        placeholder={placeholder}
        className="border-2 border-primary w-[250] flex-3"
        {...register(name)}
      />
    </div>
  );
}


export default FormField;