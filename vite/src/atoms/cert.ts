import { atom } from "jotai";

interface ICertificateData {
  projectId: string;
}

export const certsQueryID = atom(0);

export const certs = atom(async (get): Promise<ICertificateData[]> => {
  get(certsQueryID);
  try {
    return await window.send("cert.getKeys");
  } catch (error) {
    console.error(error);
    return [];
  }
});
