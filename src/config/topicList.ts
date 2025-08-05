// config/topicList.ts
const topicList = [
  {
    topic: "UI/LayOut/moveTomap",
    keyList: {
      vehId: "string",
      maps: "array",
    },
  },
  {
    topic: "UI/LayOut/moveToPickUp",
    keyList: {
      vehId: "string",
      maps: "array",
      from_station: "string",
      to_station: "string",
    },
  },
  {
    topic: "UI/LayOut/moveToDropDown",
    keyList: {
      vehId: "string",
      maps: "array",
      from_station: "string",
      to_station: "string",
    },
  },
  {
    topic: "UI/LayOut/dropDown",
    keyList: {
      vehId: "string",
      from_station: "string",
      to_station: "string",
    },
  },
  {
    topic: "UI/LayOut/pickUp",
    keyList: {
      vehId: "string",
      from_station: "string",
      to_station: "string",
    },
  },
  // 필요한 topic들을 추가하세요.
];

export default topicList;
