
import React,{createContext,useCallback,useContext,useEffect,useMemo,useRef,useState} from "react";
import {Animated,View,Text,TouchableOpacity,StyleSheet,Alert} from "react-native";
import {useTheme} from "./theme";
// 상태 배지: 모집중/접수마감 등 운영 상태를 색으로 구분한다.
const tone=C=>({"모집중":{bg:C.successSoft,fg:C.green},"접수마감":{bg:C.dangerSoft,fg:C.danger},"전화접수":{bg:C.soft,fg:C.infoFg}});
export function StatusBadge({status,style}){
 const {C}=useTheme();const s=useMemo(()=>styles(C),[C]);
 const t=tone(C)[status]||{bg:C.chipBg,fg:C.muted};
 return <Text style={[s.badge,{backgroundColor:t.bg,color:t.fg},style]}>{status||"운영정보 확인"}</Text>;
}
// 목록 로딩용 스켈레톤 카드
export function CardSkeleton(){
 const {C}=useTheme();const s=useMemo(()=>styles(C),[C]);
 return <View style={s.skel}><View style={s.skelIcon}/><View style={{flex:1,gap:7}}><View style={[s.line,{width:"72%"}]}/><View style={[s.line,{width:"48%"}]}/><View style={[s.line,{width:"60%"}]}/></View></View>;
}
export function ListSkeleton({count=4}){
 return <View>{Array.from({length:count}).map((_,i)=><CardSkeleton key={i}/>)}</View>;
}
// 빈 상태 / 오류 상태 공통 UI
export function Empty({title,desc,actionLabel,onAction}){
 const {C}=useTheme();const s=useMemo(()=>styles(C),[C]);
 return <View style={s.empty}>
  <Text style={s.emptyTitle}>{title}</Text>
  {desc?<Text style={s.emptyDesc}>{desc}</Text>:null}
  {actionLabel?<TouchableOpacity style={s.btn} onPress={onAction} accessibilityRole="button" accessibilityLabel={actionLabel}><Text style={s.btnText}>{actionLabel}</Text></TouchableOpacity>:null}
 </View>;
}
// 신청 마감(apply_end)까지 남은 날짜. 서버 호출 없이 응답값만으로 계산한다.
// 오늘 마감이면 "오늘 마감", 1~7일 남으면 "D-N", 지났거나 마감일이 없으면 null(배지 없음).
export function deadlineLabel(applyEnd){
 const t=String(applyEnd||"").slice(0,10);
 if(!/^\d{4}-\d{2}-\d{2}$/.test(t))return null;
 const [y,m,d]=t.split("-").map(Number);
 const now=new Date();
 const days=Math.round((new Date(y,m-1,d)-new Date(now.getFullYear(),now.getMonth(),now.getDate()))/86400000);
 if(days<0||days>7)return null;
 return days===0?"오늘 마감":`D-${days}`;
}
export function DeadlineBadge({applyEnd,style}){
 const {C}=useTheme();const s=useMemo(()=>styles(C),[C]);
 const label=deadlineLabel(applyEnd);
 if(!label)return null;
 const urgent=label==="오늘 마감"||label==="D-1";
 return <Text style={[s.badge,{backgroundColor:urgent?C.dangerSoft:C.chipBg,color:urgent?C.danger:C.warn},style]}>{label}</Text>;
}
// 네트워크/서버 오류를 사용자 문구로 바꿔 알린다.
export function friendlyError(e){
 const m=String(e&&e.message||"");
 if(!m||/network request failed|failed to fetch/i.test(m))return "네트워크에 연결할 수 없어요. 연결 상태를 확인한 뒤 다시 시도해 주세요.";
 if(/^HTTP 5/.test(m))return "서버가 잠시 응답하지 않아요. 잠시 후 다시 시도해 주세요.";
 return m;
}
export function alertError(e,title="문제가 발생했어요"){Alert.alert(title,friendlyError(e));}
// 가벼운 안내는 토스트로, 오류나 확인이 필요한 건 Alert 로 남긴다.
const ToastCtx=createContext(()=>{});
export function ToastProvider({children}){
 const {C}=useTheme();const s=useMemo(()=>styles(C),[C]);
 const [msg,setMsg]=useState(null);
 const op=useRef(new Animated.Value(0)).current;
 const y=useRef(new Animated.Value(14)).current;
 const timer=useRef(null);
 const show=useCallback(text=>{
  if(!text)return;
  setMsg(String(text));
  clearTimeout(timer.current);
  op.setValue(0);y.setValue(14);
  Animated.parallel([
   Animated.timing(op,{toValue:1,duration:160,useNativeDriver:true}),
   Animated.spring(y,{toValue:0,useNativeDriver:true,speed:18,bounciness:6})
  ]).start();
  timer.current=setTimeout(()=>{
   Animated.parallel([
    Animated.timing(op,{toValue:0,duration:220,useNativeDriver:true}),
    Animated.timing(y,{toValue:14,duration:220,useNativeDriver:true})
   ]).start(({finished})=>{if(finished)setMsg(null)});
  },1800);
 },[op,y]);
 useEffect(()=>()=>clearTimeout(timer.current),[]);
 return <ToastCtx.Provider value={show}>
  <View style={{flex:1}}>
   {children}
   {msg?<Animated.View pointerEvents="none" style={[s.toast,{opacity:op,transform:[{translateY:y}]}]}>
     <Text style={s.toastText}>{msg}</Text>
    </Animated.View>:null}
  </View>
 </ToastCtx.Provider>;
}
export function useToast(){return useContext(ToastCtx)}
const styles=C=>StyleSheet.create({
 badge:{fontSize:9.5,fontWeight:"900",paddingHorizontal:8,paddingVertical:4,borderRadius:99,overflow:"hidden",alignSelf:"flex-start"},
 skel:{backgroundColor:C.card,borderWidth:1,borderColor:C.line,borderRadius:19,padding:14,marginBottom:9,flexDirection:"row",gap:11},
 skelIcon:{width:47,height:47,borderRadius:14,backgroundColor:C.skeleton},
 line:{height:11,borderRadius:99,backgroundColor:C.skeleton},
 empty:{backgroundColor:C.card,borderWidth:1,borderColor:C.line,borderRadius:19,padding:22,alignItems:"center",marginTop:8},
 emptyTitle:{fontSize:13.5,fontWeight:"900",color:C.navy,textAlign:"center"},
 emptyDesc:{fontSize:11.5,color:C.muted,lineHeight:19,textAlign:"center",marginTop:7},
 btn:{backgroundColor:C.blue,paddingHorizontal:18,paddingVertical:13,borderRadius:13,alignItems:"center",marginTop:15,alignSelf:"stretch"},
 btnText:{color:C.onAccent,fontWeight:"900"},
 toast:{position:"absolute",left:26,right:26,bottom:96,backgroundColor:C.heroBg,borderRadius:14,paddingVertical:13,paddingHorizontal:16,alignItems:"center"},
 toastText:{color:C.heroTitle,fontSize:12.5,fontWeight:"800",textAlign:"center"}
});
