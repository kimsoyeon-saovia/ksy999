window.InquiryPricing = {
  // 임시 정책: 화질 포인트 + 길이 포인트. 정책 확정 시 이 함수에서 변경합니다.
  videoPoints(quality, duration, config) {
    return (config.qualities.find(x=>x.id===quality)?.points||0)+(config.durations.find(x=>x.id===duration)?.points||0);
  },
  videoQuantity(item) {
    const quantity=Number(item?.quantity);
    return Number.isFinite(quantity)?Math.max(1,Math.min(999,Math.trunc(quantity))):1;
  },
  setVideoQuantity(state,id,count) {
    const item=(state.items||[]).find(item=>item.id===id);
    if(!item)return null;
    item.quantity=this.videoQuantity({quantity:count});
    return item;
  },
  personal(state, config) {
    const confirmed = (state.items||[]).reduce((n,item)=>n+this.videoPoints(item.quality,item.duration,config)*this.videoQuantity(item),0);
    const draft = this.videoPoints(state.quality,state.duration,config);
    const required = confirmed+draft;
    const purchased = config.plans.reduce((n,x)=>n+x.price*(state.plans[x.id]||0),0);
    const granted = config.plans.reduce((n,x)=>n+(x.points+(x.bonus||0))*(state.plans[x.id]||0),0);
    const shortage = Math.max(0,required-granted);
    return {confirmed,draft,required,purchased,granted,shortage,total:purchased+shortage*config.pointValue};
  },
  confirmVideo(state, config) {
    if(!config.qualities.some(x=>x.id===state.quality)||!config.durations.some(x=>x.id===state.duration))return null;
    state.items ||= [];
    state.nextVideoId=(state.nextVideoId||0)+1;
    const item={id:String(state.nextVideoId),quality:state.quality,duration:state.duration,quantity:1};
    state.items.push(item);
    state.quality=null;state.duration=null;
    return item;
  },
  removeVideo(state,id) {
    state.items=(state.items||[]).filter(item=>item.id!==id);
  },
  corporate(state, config) {
    const product=config.products.find(x=>x.id===state.product);
    const extra=config.extras.filter(x=>state.extras.includes(x.id)).reduce((n,x)=>n+x.price,0);
    return {product,extra,total:!product?0:product.price===null?null:product.price+extra};
  }
};
