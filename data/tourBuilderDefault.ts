import type { TourBuilderState } from "@/lib/pdf-builder/types";

export const tourBuilderDefault: TourBuilderState = {
  colors: {
    accent: "#CBAF87",
    text: "#0f172a",
    footer: "#334155"
  },
  fonts: {
    heading: "Playfair Display",
    body: "Montserrat"
  },
  cover: {
    title: "CENTRAL ASIA",
    subtitle: "10 nights",
    backgroundImageUrl:
      "https://images.unsplash.com/photo-1677156811762-842312963ecd?w=1200&q=80",
    logoUrl: "",
    titleFont: "Playfair Display",
    titleColor: "#ffffff",
    titleStyle: "uppercase",
    titleWeight: "700",
    titleLetterSpacing: "wide"
  },
  overview: {
    title: "DISCOVERY",
    subtitle: "Silk Road Trip",
    dates: "Saturday 3 May - Tuesday 13 May 2025 | 10 nights",
    extensionNote: "Plus optional 3 night extension",
    welcomeText: `Welcome to an exciting journey through the ancient cities of Uzbekistan and its disappearing natural treasures!

This tour will immerse you in a unique world of history, culture, and natural beauty. Explore the magnificent cities of Samarkand, Bukhara, and Khiva — true gems of the Silk Road, filled with architectural masterpieces and centuries-old traditions. Discover Uzbekistan's cultural heritage, including artisan workshops for silk production and traditional spices, and savour the delights of the local cuisine. Relax by the shores of Lake Aydarkul and venture to the vanishing Aral Sea to witness breathtaking landscapes and feel the atmosphere of a fading era.

Experience the hospitality of the locals, participate in culinary master classes, and create unforgettable memories!`
  },
  inclusions: {
    included: [
      "International economy class airfare ex Dusseldorf (on Uzbekistan airlines (direct) or Turkish airlines via Istanbul)",
      "The services of an experienced tour manager",
      "All accommodation - double/twin clean boutique hotels",
      "Meals: breakfast & dinner (lunch as specified in the itinerary)",
      "Transfers, guided tours and entrance fees as detailed in the itinerary",
      "All transportation including car/bus, train and domestic flight tickets as specified in the itinerary",
      "All tips for local guides and drivers",
      "Folk Show in Bukhara"
    ],
    excluded: [
      "Travel Insurance (optional)",
      "Any private expenses (for ex. alcohol drinks)",
      "Meals not specified in the Itinerary",
      "Hotel porterage",
      "Filming fees for production photos and video cameras",
      "Expenses for excess baggage",
      "Any charged activity not mentioned in the program"
    ],
    highlights: [
      "Ancient Cities of the Silk Road: Explore Samarkand, Bukhara, and Khiva — true gems with stunning architecture and centuries-old traditions.",
      "UNESCO World Heritage Sites: Visit historical sites like Konya Urgench, Nisa, and the Ichan Kala in Khiva",
      "Culinary Master Classes: Discover the secrets of Uzbek cuisine and enjoy traditional dishes.",
      "Carpet Weaving: Explore a carpet factory where you can witness the intricate art of traditional weaving",
      "Wine Tasting: Savour exquisite local wines and learn about the region's winemaking traditions.",
      "Folk Show: Experience an authentic open-air folklore show in Bukhara, celebrating Central Asian culture",
      "Aral Sea: Witness unique \"Martian\" landscapes and traces of a vanishing era.",
      "Savitskiy Museum: Discover one of the world's largest collections of avant-garde art in Nukus.",
      "Boating to the picturesque waterfalls: enjoying serene views and a refreshing experience amidst nature's beauty.",
      "Hospitality and Local Traditions: Immerse yourself in the culture, flavours, and history of Uzbekistan.",
      "Extend your journey with the option to continue the tour to Aral sea and Chimgan mountains →"
    ]
  },
  tourManager: {
    enabled: true,
    name: "AMAL YULDASHEV",
    bio: `Your tour manager is Amal Yuldashev, who was born and raised in Uzbekistan. Amal is an experienced tour organiser who strives to make every trip unforgettable for all group members. He is a passionate and seasoned traveller, having visited more than 25 countries. Amal has a deep knowledge of the culture and traditions of Asia, where he has spent significant time exploring its rich history and unique destinations. He is eager to share his expertise and skills to make your journey comfortable, engaging, and memorable, introducing you to special and little-known places in this remarkable region.`,
    avatarUrl: ""
  },
  price: {
    mainTitle: "Main tour - Uzbekistan Classic",
    mainPrice: "€3160 €2970 (incl. flight/transfers + meals)",
    mainSingleSupplement: "Single supplement €490",
    extensionTitle: "Optional extension - Aral sea and Chimgan mountains",
    extensionPrice: "Twin share per person €690",
    extensionSingleSupplement: "Single supplement €90",
    currencyNote:
      "The prices listed are in EUR and include international flights departing from Dusseldorf International Airport to Tashkent, Uzbekistan. If you're interested in a single occupancy room, please don't hesitate to reach out to us. For solo travellers open to sharing, let us know, and we'll do our best to match you with a suitable roommate.",
    additionalNotes: `GROUP SIZE Minimum 6, maximum 18

CUSTOM TRAVEL OPTIONS: We're happy to assist with any additional travel plans you may have before or after the tour. If you wish to depart from a different airport or upgrade to business class, we can make those arrangements for you. Just get in touch to discuss your preferences.

To fully enjoy this tour, participants should possess a good level of fitness, as it will involve 2 to 3 hours of walking and 1 to 2 hours of standing during excursions. The walks may occasionally traverse uneven terrain, including slopes and stairs. Travelling in May and June represents the shoulder season, characterised by moderate temperatures, although one should be prepared for variations in weather conditions. Several days will involve spending a significant portion of the day on travel, albeit with scheduled stops for rest and exploration. It is important to note that certain segments of the Tajikistan portion of the tour reach altitudes of up to 2,700 metres, so you should assess whether such elevations are suitable for you.

With over 30 years of experience in organising tours in Central Asia, we draw on the best elements from previous expeditions to provide a comprehensive and hassle-free experience. All arrangements are thoughtfully managed for you, allowing you to focus entirely on the journey ahead.`,
    discountNote: "-5% *valid until the end of February."
  },
  contact: {
    phone: "0049 151 29017533",
    email: "INFO@JINN-TRAVEL.COM",
    website: "WWW.JINN-TRAVEL.COM"
  },
  itinerary: [
    {
      id: "1",
      date: "Saturday May 3",
      title: "Dusseldorf to Tashkent",
      meals: "Dinner",
      description:
        "Welcome to the vibrant and hospitable Tashkent! Upon arrival, you will have a comfortable transfer to the hotel and time to rest. In the evening, you can enjoy dinner where you'll get acquainted with Uzbek cuisine and the warmth of local hospitality.",
      imageUrl: "https://images.unsplash.com/photo-1654861857754-4a6a5a1de01e?w=800&q=80",
      location: "Tashkent, Uzbekistan"
    },
    {
      id: "2",
      date: "Sunday May 4",
      title: "Sightseeing Tashkent",
      meals: "Breakfast/Lunch/Dinner",
      description: `A fascinating tour of Tashkent awaits, where you'll visit Khast Imam, Chorsu Bazaar, and other historical landmarks. Lunch will be served at a traditional venue with a tasting of plov. In the evening, you'll ascend 104 metres to the famous Tashkent TV Tower, where a dinner in the revolving restaurant offers breathtaking views of the city by night.`,
      imageUrl: "https://images.unsplash.com/photo-1673446840855-1c82bafdb67d?w=800&q=80",
      location: "Chorsu bazaar, Uzbekistan"
    },
    {
      id: "3",
      date: "Monday May 5",
      title: "Culinary Delights in Samarkand",
      meals: "Breakfast/Dinner",
      description: `Transfer to Samarkand – a city whose architectural monuments are part of the UNESCO World Heritage. This ancient city will immerse you in the era of the Silk Road. Upon arrival, enjoy free time to stroll through the old streets. Continue with a delightful cooking class and lunch inside an Uzbek home, where you can immerse yourself in the local culinary traditions.`,
      imageUrl: "https://images.unsplash.com/photo-1553544438-f38bf768a907?w=800&q=80",
      location: "Plov Centre, Uzbekistan"
    },
    {
      id: "4",
      date: "Tuesday May 6",
      title: "Shakhrisabz",
      meals: "Breakfast/Dinner",
      description: `Journey to Shakhrisabz, the birthplace of Tamerlane, where you will marvel at the ancient ruins of Ak-Saray and other architectural landmarks. Enjoy a lunch break at the mountain pass, savoring authentic Tandir kebab in a traditional setting. After an eventful day, return to Samarkand. You will see an evening light show at the Registan this evening.`,
      imageUrl: "https://images.unsplash.com/photo-1733586092622-1b3201e802a5?w=800&q=80",
      location: "Samarkand, Uzbekistan"
    },
    {
      id: "5",
      date: "Wednesday May 7",
      title: "Transit to Bukhara",
      meals: "Breakfast/Dinner",
      description: `Transfer to Bukhara with an enriching stop at the renowned artisan center in Gijduvan, famous for its exceptional pottery. Here, you'll have the opportunity to visit a well-known pottery workshop run by a family of artisans who have been perfecting their craft for generations. Learn about the intricate techniques of traditional ceramic-making, from shaping clay to the delicate hand-painting of unique patterns that reflect the rich cultural heritage of Uzbekistan. Upon arriving in Bukhara, immerse yourself in the exploration of this ancient city, known for its well-preserved architecture and rich history.`,
      imageUrl: "https://images.unsplash.com/photo-1670514535515-e7af911bdadb?w=800&q=80",
      location: "Gijduvan, Uzbekistan"
    },
    {
      id: "6",
      date: "Thursday May 8",
      title: "Bukhara Folk-Show",
      meals: "Breakfast/Lunch/Dinner",
      description: `Today, explore Uzbekistan's rich cultural heritage through its local artisans and crafts. Enjoy traditional music performances and taste a variety of delectable local dishes. Take this opportunity to shop for unique souvenirs crafted by talented artisans from all over Uzbekistan. You'll also have the option to visit Bukhara's historic old bathhouse, offering a relaxing and unique cultural experience.`,
      imageUrl: "https://images.unsplash.com/photo-1705681948254-af6d97be06b7?w=800&q=80",
      location: "Bukhara, Uzbekistan"
    },
    {
      id: "7",
      date: "Friday May 9",
      title: "Bukhara Environs",
      meals: "Breakfast/Dinner",
      description: `Your exploration of the Bukhara region continues with a morning visit to the Chor Bakr necropolis, an ancient city of the dead set among rows of mulberry trees just outside Bukhara. You'll also have the opportunity to see the White Palace of Kagan, constructed by the last Emir of Bukhara to host Nicholas II of Russia. Additionally, you'll visit the Bokhoutdin Nakhshbandi complex, an important holy Islamic site, and the Emir's summer palace, known as Sitorai Mohi Hosa. In the evening, enjoy a special dinner featuring traditional Bukhara cuisine in the welcoming atmosphere of a local family's home.`,
      imageUrl: "https://images.unsplash.com/photo-1662468752704-f256cf5c6784?w=800&q=80",
      location: "Bukhara, Uzbekistan"
    },
    {
      id: "8",
      date: "Saturday May 10",
      title: "Transit to Khiva",
      meals: "Breakfast/Dinner",
      description: `Travel to Kala, passing through the ancient fortresses of the Kyzylkum Desert. Along the journey, stop for a delicious lunch, experiencing the distinct flavors of local cuisine. Explore the area's historical landmarks and immerse yourself in its rich past and cultural heritage. After your exploration, return to Khiva for a relaxing evening and an overnight stay.`,
      imageUrl: "https://images.unsplash.com/photo-1699438998191-973120762f81?w=800&q=80",
      location: "Khiva, Uzbekistan"
    },
    {
      id: "9",
      date: "Sunday May 11",
      title: "Kyzylkum Fortresses",
      meals: "Breakfast/Lunch/Dinner",
      description: `Spend a full day exploring the treasures of Khiva, an open-air museum city. Wander through its maze of ancient streets and admire well-preserved architectural monuments such as grand palaces, intricately carved wooden columns, and unique minarets. Absorb the rich history and culture that permeates every corner of this incredible city. In the evening, relish a dinner featuring traditional national dishes in a rooftop restaurant, offering breathtaking views of Khiva under the starry night sky.`,
      imageUrl: "https://images.unsplash.com/photo-1744177311165-79c48db4c105?w=800&q=80",
      location: "Kyzylkum Desert, Uzbekistan"
    },
    {
      id: "10",
      date: "Monday May 12",
      title: "Last day of the main trip",
      meals: "Breakfast",
      description: `The next day, transfer to the airport for your flight to Tashkent. Upon arrival, enjoy a free day to explore the city at your own pace or simply relax. There is the option of a flight from Urgench for further travel.`,
      imageUrl: "https://images.unsplash.com/photo-1654861857614-3039e74738d0?w=800&q=80",
      location: "Tashkent, Uzbekistan"
    },
    {
      id: "11",
      date: "Monday May 13",
      title: "Back home or join our extension to Aral Sea",
      meals: "Breakfast",
      description: "Transfer to International airport for flight back to Germany.",
      imageUrl: "https://images.unsplash.com/photo-1569336415962-a4bd9f69cd83?w=800&q=80",
      location: ""
    }
  ],
  optionalExtension: {
    enabled: true,
    title: "OPTIONAL EXTENSION",
    intro: `While you're in Central Asia, you may want to enhance your experience with an optional post-tour extension to Kazakhstan and Kyrgyzstan. This extension requires a minimum of 6 participants and will be led by the same tour manager, who accompanied the main Central Asia tour. It's a great opportunity to further explore the region's diverse cultures and landscapes.`,
    days: [
      {
        id: "ext-1",
        date: "Tuesday May 13",
        title: "Journey to the Aral Sea",
        meals: "Breakfast/Dinner",
        description: `Embark on a journey to the vanishing Aral Sea, a poignant reminder of dramatic environmental changes. Explore the haunting beauty of abandoned ships lying on the dry seabed, giving the area an otherworldly, Mars-like appearance. It's a rare opportunity to witness these disappearing landscapes, filled with history, mystery, and surreal natural beauty.`,
        imageUrl: "https://images.unsplash.com/photo-1746970169119-46f69f46f938?w=800&q=80",
        location: "Aral Sea"
      },
      {
        id: "ext-2",
        date: "Wednesday May 14",
        title: "Back to Civilisation",
        meals: "Breakfast/Dinner",
        description: `Start your day with a breakfast in nature, soaking in the serene atmosphere and fresh morning air. Afterward, make your way back to Nukus, bringing your Aral Sea adventure to a close. Enjoy your journey back to Tashkent, reflecting on the fascinating experiences of the past days in the heart of Central Asia. Take some time to relax and unwind as you transition back to the vibrancy of city life.`,
        imageUrl: "https://images.unsplash.com/photo-1606771090633-66bf56fb13fb?w=800&q=80",
        location: "Nukus"
      },
      {
        id: "ext-3",
        date: "Thursday May 15",
        title: "Chimgan Mountains Adventure",
        meals: "Breakfast/Lunch/Dinner",
        description: `Spend a day amidst the beauty of the Chimgan Mountains. Begin with an exhilarating ascent to the summit, where breathtaking panoramic views await. Enjoy a delicious open-air lunch surrounded by nature, followed by a refreshing swim in the scenic Charvak Reservoir. Complete your adventure with a boat trip to picturesque waterfalls, soaking in the natural wonders of the region. In the evening, return to Tashkent and enjoy a relaxing dinner.`,
        imageUrl: "https://images.unsplash.com/photo-1594629609174-00db53036357?w=800&q=80",
        location: "Chimgan, Uzbekistan"
      },
      {
        id: "ext-4",
        date: "Friday May 16",
        title: "Back home",
        meals: "Breakfast",
        description: "Transfer to International airport for flight back to Germany.",
        imageUrl: "https://images.unsplash.com/photo-1663963116089-d56986ea8d8b?w=800&q=80",
        location: ""
      }
    ]
  }
};
