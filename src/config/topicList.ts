// config/topicList.ts
const topicList = [
  {
    topic: "UI/LayOut/moveToEdge",
    keyList: {
      vehId: "string",
      edges: "array",
    },
  },
  {
    topic: "UI/LayOut/moveToPickUp",
    keyList: {
      vehId: "string",
      edges: "array",
      from_station: "string",
      to_station: "string",
    },
  },
  {
    topic: "UI/LayOut/moveToDropDown",
    keyList: {
      vehId: "string",
      edges: "array",
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
