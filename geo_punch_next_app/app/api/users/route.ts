import { db } from "@/utils/prisma";
import bcrypt from "bcryptjs";

export async function GET(): Promise<Response> {
  const data = await db.employees.findMany({
    include: {
      departments: true,
      designations: true,
      id_card_no: true,
      name: true,
      phone_no: true,
      is_active: true,
      email: true,
      is_admin: true,
    },
  }).then((result) => { 
    console.log('Fetched users successfully:', result);
    return result;
  }).catch((error) => {
    console.error('Error fetching users:', error);
    throw error;
  });

  return Response.json({ users: data });
}

export async function POST(request: Request): Promise<Response> {
  const data = await request.json();
  console.log('Received data:', data); // Debug log for incoming data

  // Here you would typically handle the data, e.g., save it to a database
  const res = await db.employees.create({
    data: {
      id_card_no: data.id_card_no,
      name: data.name,
      departments: {
        connect: { id: data.department_id },
      },
      designations: {
        connect: { id: data.designation_id },
      },
      phone_no: data.phone_no,
      is_active: data.isActive,
      email: data.email,
      password: data.password,
      hashed_password:  await bcrypt.hash(data.password, 10),
      is_admin: data.isAdmin,
    },
  }).then((result) => {
    console.log('User created successfully:', result)
  }).catch((error) => {
    console.error('Error creating user:', error);
    throw error;
  });

  return Response.json({ message: 'User created successfully', user: res });
}