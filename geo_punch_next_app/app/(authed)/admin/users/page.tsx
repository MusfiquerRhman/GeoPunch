"use client";

import Wrapper from "@/components/UI/Wrapper";
import { createUser } from "./actions";
import { useForm } from "react-hook-form";
import { userSchema } from "./schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";

export default function Home() {
  const form = useForm({
    resolver: zodResolver(userSchema),
  });

  const [departments, setDepartments] = useState([]);

  useEffect(() => {
    fetch("/api/library/department").then((res) => res.json()).then((data) => {
        setDepartments(data);
      })
      .catch((err) => console.error(err));
  }, []);

  const [designations, setDesignations] = useState([]);

  useEffect(() => {
  fetch("/api/library/designation").then((res) => res.json()).then((data) => {
      setDesignations(data);
    })
    .catch((err) => console.error(err));
  }, []);

  useEffect(() => {
    console.log("Departments updated:", departments);
  }, [departments]);
  
  const onSubmit = async (data: any) => {
    const formData = new FormData();

    Object.entries(data).forEach(([key, value]) => {
      formData.append(key, String(value));
    });

    const res = await createUser(formData);

    console.log(res); // handle success/error here
  };

  return (
    <Wrapper heading="User Management">
      <form onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-row flex-wrap gap-4 w-full max-w-[550]"
      >
        <div className="flex w-full">
          <label className="font-medium flex-1">ID Card No</label>
          <input placeholder="Id Card Number" className="border-2 border-primary w-[250] flex-3" {...form.register("id_card_no")} />
        </div>
        <div className="flex w-full">
          <label className="font-medium flex-1">Name</label>
          <input placeholder="Name" className="border-2 border-primary w-[250] flex-3" {...form.register("name")} />
        </div>
        <div className="flex w-full">
          <label className="font-medium flex-1">Department ID</label>
            <select defaultValue={''} {...form.register("department_id")} className="border-2 border-primary w-[250] flex-3">
              <option disabled value="">Select Department</option>
              {departments.map((d: any) => (
                <option key={d.id} value={d.id}>
                  {d.department_name}
                </option>
            ))}
          </select>
        </div>
        <div className="flex w-full">
          <label className="font-medium flex-1">Designation ID</label>
          <select defaultValue={''} {...form.register("designation_id")} className="border-2 border-primary w-[250] flex-3">
            <option disabled value="">Select Designation</option>
            {designations.map((d: any) => (
              <option key={d.id} value={d.id}>
                {d.designation_name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex w-full">
          <label className="font-medium flex-1">Phone No</label>
          <input placeholder="Phone Number" className="border-2 border-primary w-[250] flex-3" {...form.register("phone_no")} />
        </div>
        <div className="flex w-full">
          <label className="font-medium flex-1">Email</label>
          <input placeholder="Email" className="border-2 border-primary w-[250] flex-3" {...form.register("email")} />
        </div>
        <div className="flex w-full">
          <label className="font-medium flex-1">Password</label>
          <input placeholder="Password" className="border-2 border-primary w-[250] flex-3" type="password" {...form.register("password")} />
        </div>
        <div className="flex w-full justify-start">
          <label className="font-medium w-1/4">Is Admin</label>
          <input
            type="checkbox"
            {...form.register("isAdmin")}
            className="w-3/4"
            onChange={(e) => form.setValue("isAdmin", e.target.checked)}
          />
        </div>

        <button type="submit">Submit</button>
      </form>
    </Wrapper>
  );
}