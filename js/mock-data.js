// ข้อมูลตัวอย่างสำรองสำหรับพรีวิวดีไซน์และ fallback ระหว่างรอ API จริง
const MOCK_MEMBERS = {
  basic: {
    crmName: "Mali",
    membershipTier: "Basic",
    point: 48,
    discountPercent: 5,
    monthlyAverage: 240,
    chargeProgress: 38,
    nextTierName: "Bronze",
    amountToNextTierMonthly: 100,
    promotions: []
  },
  bronze: {
    crmName: "Narin",
    membershipTier: "Bronze",
    point: 126,
    discountPercent: 7,
    monthlyAverage: 620,
    chargeProgress: 56,
    nextTierName: "Silver",
    amountToNextTierMonthly: 200,
    promotions: []
  },
  silver: {
    crmName: "Anya",
    membershipTier: "Silver",
    point: 188,
    discountPercent: 8,
    monthlyAverage: 980,
    chargeProgress: 72,
    nextTierName: "Gold",
    amountToNextTierMonthly: 150,
    promotions: []
  },
  gold: {
    crmName: "Rei",
    membershipTier: "Gold",
    point: 245,
    discountPercent: 10,
    monthlyAverage: 1387,
    chargeProgress: 84,
    nextTierName: "Platinum",
    amountToNextTierMonthly: 150,
    promotions: []
  },
  platinum: {
    crmName: "Isara",
    membershipTier: "Platinum",
    point: 680,
    discountPercent: 12,
    monthlyAverage: 2120,
    chargeProgress: 100,
    nextTierName: "",
    amountToNextTierMonthly: 0,
    nextBestAction: "ระดับสูงสุดของสมาชิก ขอบคุณที่เดินทางกับเรา",
    promotions: []
  }
};

const DEFAULT_BENEFITS = [
  { rewardType: "discount", title: "ส่วนลดสมาชิก", copy: "ส่วนลดตามระดับสมาชิก" },
  { rewardType: "product", title: "แลกสินค้า", copy: "ใช้แต้มแลกเมนูหรือสินค้าในร้าน" },
  { rewardType: "massage-chair", title: "เก้าอี้นวด", copy: "สิทธิ์แลกเวลานวดเมื่อมีโปรโมชัน" }
];
