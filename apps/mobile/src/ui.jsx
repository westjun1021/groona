
import React from "react";
import {View,Text,TouchableOpacity,StyleSheet,Alert} from "react-native";
import {C} from "./theme";
// 상태 배지: 모집중/접수마감 등 운영 상태를 색으로 구분한다.
const TONE={"모집중":{bg:"#EAF9F5",fg:C.green},"접수마감":{bg:"#FBEDED",fg:C.danger},"전화접수":{bg:C.soft,fg:"#2F7FD1"}};
export function StatusBadge({status,style}){
 const t=TONE[status]||{bg:"#F0F4F6",fg:C.muted};
 return <Text style={[s.badge,{backgroundColor:t.bg,color:t.fg},style]}>{status||"운영정보 확인"}</Text>;
}
// 목록 로딩용 스켈레톤 카드
export function CardSkeleton(){
 return <View style={s.skel}><View style={s.skelIcon}/><View style={{flex:1,gap:7}}><View style={[s.line,{width:"72%"}]}/><View style={[s.line,{width:"48%"}]}/><View style={[s.line,{width:"60%"}]}/></View></View>;
}
export function ListSkeleton({count=4}){
 return <View>{Array.from({length:count}).map((_,i)=><CardSkeleton key={i}/>)}</View>;
}
// 빈 상태 / 오류 상태 공통 UI
export function Empty({title,desc,actionLabel,onAction}){
 return <View style={s.empty}>
  <Text style={s.emptyTitle}>{title}</Text>
  {desc?<Text style={s.emptyDesc}>{desc}</Text>:null}
  {actionLabel?<TouchableOpacity style={s.btn} onPress={onAction} accessibilityRole="button" accessibilityLabel={actionLabel}><Text style={s.btnText}>{actionLabel}</Text></TouchableOpacity>:null}
 </View>;
}
// 네트워크/서버 오류를 사용자 문구로 바꿔 알린다.
export function friendlyError(e){
 const m=String(e&&e.message||"");
 if(!m||/network request failed|failed to fetch/i.test(m))return "네트워크에 연결할 수 없어요. 연결 상태를 확인한 뒤 다시 시도해 주세요.";
 if(/^HTTP 5/.test(m))return "서버가 잠시 응답하지 않아요. 잠시 후 다시 시도해 주세요.";
 return m;
}
export function alertError(e,title="문제가 발생했어요"){Alert.alert(title,friendlyError(e));}
const s=StyleSheet.create({
 badge:{fontSize:9.5,fontWeight:"900",paddingHorizontal:8,paddingVertical:4,borderRadius:99,overflow:"hidden",alignSelf:"flex-start"},
 skel:{backgroundColor:C.card,borderWidth:1,borderColor:C.line,borderRadius:19,padding:14,marginBottom:9,flexDirection:"row",gap:11},
 skelIcon:{width:47,height:47,borderRadius:14,backgroundColor:"#EDF2F5"},
 line:{height:11,borderRadius:99,backgroundColor:"#EDF2F5"},
 empty:{backgroundColor:"#fff",borderWidth:1,borderColor:C.line,borderRadius:19,padding:22,alignItems:"center",marginTop:8},
 emptyTitle:{fontSize:13.5,fontWeight:"900",color:C.navy,textAlign:"center"},
 emptyDesc:{fontSize:11.5,color:C.muted,lineHeight:19,textAlign:"center",marginTop:7},
 btn:{backgroundColor:C.blue,paddingHorizontal:18,paddingVertical:13,borderRadius:13,alignItems:"center",marginTop:15,alignSelf:"stretch"},
 btnText:{color:"#fff",fontWeight:"900"}
});
