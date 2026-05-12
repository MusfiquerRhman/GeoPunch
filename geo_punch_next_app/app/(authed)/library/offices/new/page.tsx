"use client";

import { Wrapper, FormField } from "@/components";
import { useForm } from "react-hook-form";
import { officeSchema } from "../schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import MapPicker from "@/components/LocationSelector";
import { toast } from 'sonner';

type LocationType = {
  address: string;
  lat: number | null;
  lng: number | null;
};

export default function NewOffice() {
  const form = useForm({
    resolver: zodResolver(officeSchema),
  });

  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [companies, setCompanies] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [locations, setLocations] = useState<LocationType[]>([
    { address: "", lat: null, lng: null },
  ]);

  useEffect(() => {
    fetch("/api/library/company")
      .then((res) => res.json())
      .then((data) => setCompanies(data.companies))
      .catch((err) => console.error(err));
  }, []);

  const { register, handleSubmit } = form;

  // Update address
  const updateAddress = (index: number, value: string) => {
    const updated = [...locations];
    updated[index].address = value;
    setLocations(updated);
  };

  // Update coordinates
  const updateCoords = (index: number, coords: { lat: number; lng: number }) => {
    const updated = [...locations];
    updated[index].lat = coords.lat;
    updated[index].lng = coords.lng;
    setLocations(updated);
  };

  // Add new location block
  const addLocation = () => {
    setLocations([...locations, { address: "", lat: null, lng: null }]);
  };

  // Remove location
  const removeLocation = (index: number) => {
    const updated = locations.filter((_, i) => i !== index);
    setLocations(updated);
  };

  const onSubmit = async (data: any) => {
    setIsLoading(true);
    setMessage("");

    if (!locations.length) {
        setErrorMessage("At least one location is required");
        toast.error("At least one location is required");
        setIsLoading(false);
        return;
    }

    for (let i = 0; i < locations.length; i++) {
        const loc = locations[i];

        if (!loc.address || loc.address.trim() === "") {
            setErrorMessage(`Location ${i + 1}: Address is required`);
            toast.error(`Location ${i + 1}: Address is required`);
            setIsLoading(false);
            return;
        }

        if (loc.lat === null || loc.lng === null || isNaN(loc.lat) || isNaN(loc.lng)) {
            setErrorMessage(`Location ${i + 1}: Please select a valid position on the map`);
            toast.error(`Location ${i + 1}: Please select a valid position on the map`);
            setIsLoading(false);
            return;
        }
    }

    // Passed validation
    const payload = {
        ...data,
        locations,
    };

    // clear message before request
    setErrorMessage("");

    const response = await fetch("/api/library/office", {
      method: "POST",
      body: JSON.stringify(payload),
      headers: {
        "Content-Type": "application/json",
      },
    });

    const res = await response.json(); 

    if (!response.ok) {
        setErrorMessage(res.message); 
        toast.error(res.message || "An error occurred while creating the office");
        setMessage("");
        return;
    }

    setMessage("Company created successfully");
    toast.success("Company created successfully");
    setIsLoading(false);
  };

  useEffect(() => {
    console.log(form.formState.errors);
  }, [form.formState.errors]);

  return (
    <Wrapper heading="Office Management">
        {message && (
            <p className="w-full max-w-[550] text-green-500 border border-green-500 p-2 bg-green-50 rounded-md mb-4">
                {message}
            </p>
        )}
        {errorMessage && (
            <p className="w-full max-w-[550] text-red-500 border border-red-500 p-2 bg-red-50 rounded-md mb-4">
                {errorMessage}
            </p>
        )}

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex flex-col gap-4 w-full max-w-[550] pb-16"
      >
        <FormField
          label="Office Name"
          name="name"
          placeholder="Enter office name"
          register={register}
          errors={form.formState.errors.name}
        />

        {/* Company Select */}
        <div className="flex w-full">
            <label className="font-medium flex-1">Company ID</label>
            <div className="w-[250] flex-3">
              <select defaultValue={''} {...register("company_id")} 
                className="rounded-md px-2 py-2 w-full border-2 border-primary flex-3"
              >
                  <option disabled value="">Select Company</option>
                  {companies.map((c: any) => (
                      <option key={c.id} value={c.id}>
                          {c.name}
                      </option>
                  ))}
              </select>
              {form.formState.errors.company_id && <p className="text-red-500 text-sm">{form.formState.errors.company_id.message}</p>}
            </div>
        </div>

        {/* 🔥 Locations */}
        <div className="flex flex-col gap-6">
          {locations.map((loc, index) => (
            <div
              key={index}
              className="p-3 rounded-md flex flex-col gap-3"
            >
              <div className="flex justify-between items-center">
                <h3 className="font-semibold">Location {index + 1}</h3>

                {locations.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeLocation(index)}
                    className="text-red-500 text-sm"
                  >
                    Remove
                  </button>
                )}
              </div>

              {/* Address Field */}
              <input
                type="text"
                placeholder="Enter address"
                value={loc.address}
                onChange={(e) => updateAddress(index, e.target.value)}
                className="border-2 border-primary w-full px-2 py-1 rounded-md"
              />

              {/* Map Picker */}
              <MapPicker
                onSelect={(coords) => updateCoords(index, coords)}
              />

              {/* Debug / Display */}
              {loc.lat && loc.lng && (
                <p className="text-xs text-gray-500">
                  Lat: {loc.lat}, Lng: {loc.lng}
                </p>
              )}
            </div>
          ))}
        </div>

        {/* Add Location Button */}
        <button
          type="button"
          onClick={addLocation}
          className="bg-gray-200 px-3 py-2 rounded-md"
        >
          + Add Another Location
        </button>

        {/* Submit */}
        <button
          type="submit"
          disabled={isLoading}
          className="bg-primary text-white px-4 py-2 rounded-md"
        >
          {isLoading ? "Creating..." : "Create Office"}
        </button>
      </form>
    </Wrapper>
  );
}