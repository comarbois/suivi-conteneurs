import AsyncStorage from "@react-native-async-storage/async-storage";

export const verifyToken = async () => {
  const token = await AsyncStorage.getItem("userToken");
  console.log(token);
  if (token === null || token === undefined || token === "") {
    return false;
  }
  
  const res = await fetch(
    "https://tbg.comarbois.ma/controle_reception/api/authentification/verifyToken",
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
    }

  );

  
  if (res.status !== 200) {
    return false;
  }
  const json = await res.json();
  console.log(json);  
  return json;

};
