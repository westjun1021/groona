
import * as SecureStore from "expo-secure-store";
const KEY="groona_onboarded";
// 저장소를 읽지 못하면 '이미 봤다'로 취급한다. 매 실행마다 온보딩이 다시 뜨는 쪽이 더 나쁘다.
export async function isOnboarded(){
 try{return (await SecureStore.getItemAsync(KEY))==="true"}catch(e){return true}
}
export async function setOnboarded(){
 try{await SecureStore.setItemAsync(KEY,"true")}catch(e){}
}
export async function clearOnboarded(){
 try{await SecureStore.deleteItemAsync(KEY)}catch(e){}
}
