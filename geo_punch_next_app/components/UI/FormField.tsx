"use client";

import { UseFormRegister, FieldValues, Path } from "react-hook-form";

type FormFieldProps<T extends FieldValues> = {
  label: string;
  name: Path<T>;
  register: UseFormRegister<T>;
  type?: string;
  placeholder?: string;
  errors?: any;
};

const FormField = <T extends FieldValues>({
  label,
  name,
  register,
  type = "text",
  placeholder,
  errors
}: FormFieldProps<T>) => {

  return (
    <>
      <div className="flex items-center w-full">
        <label className="font-medium flex-1">{label}</label>
        <div className="flex-3">
          <input
            type={type}
            placeholder={placeholder}
            className={`border-2 border-primary w-full px-2 py-1 rounded-md ${errors ? 'border-red-500' : ''}`}
            {...register(name)}
          />
          {errors && <p className="text-red-500 text-sm">{errors.message}</p>}
        </div>
      </div>
    </>
  );
}


export default FormField;