
import * as Haptics from "expo-haptics";
// 햅틱은 있으면 좋은 부가 효과일 뿐이다. 지원하지 않는 기기/웹에서는 조용히 넘어간다.
export function tap(){
 try{Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(()=>{})}catch(e){}
}
export function success(){
 try{Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(()=>{})}catch(e){}
}
