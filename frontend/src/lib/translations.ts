export type Language = 'mr' | 'hi' | 'en';

export interface TranslationDictionary {
  appTitle: string;
  help: string;
  dashboard: string;
  welcomeGreeting: string;
  whatToDoToday: string;
  addProduct: string;
  addProductCardTitle: string;
  addProductCardDesc: string;
  findBuyersCardTitle: string;
  findBuyersCardDesc: string;
  myStore: string;
  myStoreCardTitle: string;
  myStoreCardDesc: string;
  messagesCardTitle: string;
  messagesCardDesc: string;
  activeProductsTitle: string;
  noProductsTitle: string;
  noProductsDesc: string;
  addFirstProductBtn: string;
  quickSharingActions: string;
  showQR: string;
  openStore: string;
  copyStoreUrl: string;
  storeUrlCopied: string;
  linkCopied: string;
  copyLink: string;
  draftRestoredBanner: string;
  draftRestoredDesc: string;
  resumeDraft: string;
  discardDraft: string;
  craftedWith: string;
  supportBannerText: string;
  liveOnline: string;
  privateStore: string;
  testOpenStore: string;
  editBtn: string;
  closeBtn: string;
  printBtn: string;
  downloadQR: string;
  scanQR: string;
  shareStore: string;
  qrPageTitle: string;
  qrPageDesc: string;
  qrPlacementTip1: string;
  qrPlacementTip2: string;
  qrPlacementTip3: string;
  enquiriesTitle: string;
  enquiriesSubtitle: string;
  newBadge: string;
  contactedBadgeLabel: string;
  markContacted: string;
  filterAll: string;
  filterNew: string;
  filterContacted: string;
  newEnquiriesCount: string;
  noEnquiriesTitle: string;
  noEnquiriesDesc: string;
  noFilterMatch: string;
  enquiryProduct: string;
  storefrontNotFound: string;
  wizardStep1Title: string;
  wizardStep1Desc: string;
  wizardStep2Title: string;
  wizardStep2Desc: string;
  takePhotoBtn: string;
  chooseGalleryBtn: string;
  listening: string;
  orTypeDetails: string;
  typePlaceholder: string;
  whatYouToldUs: string;
  recordAgainBtn: string;
  generateCatalogBtn: string;
  generatingCatalogTitle: string;
  generatingCatalogDesc: string;
  saveCatalogBtn: string;
  savingCatalogBtn: string;
  regenerateBtn: string;
  doneEditingBtn: string;
  returnToDashboard: string;
  aiCatalogTitle: string;
  aiGeneratedBadge: string;
  aiGeneratedNotice: string;
  rawInputBadge: string;
  rawInputExplanation: string;
  aiPriceGuidance: string;
  productStatusTitle: string;
  photoAdded: string;
  statusPhotoAdded: string;
  statusAiCatalogReady: string;
  statusPriceReady: string;
  statusBuyersReady: string;
  statusStorePublished: string;
  titleField: string;
  descriptionField: string;
  craftTypeField: string;
  categoryField: string;
  materialField: string;
  dimensionsField: string;
  productionTimeField: string;
  priceField: string;
  tagsField: string;
  artisanStoryField: string;
  notSpecified: string;
  errorGeneric: string;
  tryAgain: string;
  helpModalTitle: string;
  helpModalDesc: string;
  helpAddProduct: string;
  helpTopicAddProduct: string;
  helpTopicAddProductAnswer: string;
  helpTopicChangePrice: string;
  helpTopicChangePriceAnswer: string;
  helpTopicShareShop: string;
  helpTopicShareShopAnswer: string;
  helpTopicContactBuyer: string;
  helpTopicContactBuyerAnswer: string;
  voiceHelpTitle: string;
  voiceHelpDesc: string;
  voiceHelpUnsupported: string;
}

export const TRANSLATIONS: Record<Language, TranslationDictionary> = {
  mr: {
    appTitle: 'कारीगर AI',
    help: 'मदत',
    dashboard: 'डॅशबोर्ड',
    welcomeGreeting: 'स्वागत आहे',
    whatToDoToday: 'आज आपण काय करू इच्छिता?',
    addProduct: 'उत्पादन जोडा',
    addProductCardTitle: 'नवे उत्पादन जोडा',
    addProductCardDesc: 'फोटो आणि आवाजाने डिजिटल कॅटलॉग बनवा',
    findBuyersCardTitle: 'खरेदीदार शोधा',
    findBuyersCardDesc: 'घाऊक व थेट खरेदीदारांशी संपर्क करा',
    myStore: 'माझी दुकान',
    myStoreCardTitle: 'माझी डिजिटल दुकान',
    myStoreCardDesc: 'आपले उत्पादन जगभरातील ग्राहकांना दाखवा',
    messagesCardTitle: 'ग्राहक संदेश',
    messagesCardDesc: 'नवीन चौकशी आणि ग्राहकांचे संदेश पहा',
    activeProductsTitle: 'सक्रिय उत्पादने',
    noProductsTitle: 'कोणतेही उत्पादन जोडलेले नाही',
    noProductsDesc: 'आपले पहिले उत्पादन जोडून सुरुवात करा',
    addFirstProductBtn: 'पहिले उत्पादन जोडा',
    quickSharingActions: 'त्वरित शेअर करा',
    showQR: 'QR कोड दाखवा',
    openStore: 'दुकान उघडा',
    copyStoreUrl: 'दुकान लिंक कॉपी करा',
    storeUrlCopied: 'दुकान लिंक कॉपी झाली!',
    linkCopied: 'लिंक कॉपी झाली!',
    copyLink: 'लिंक कॉपी करा',
    draftRestoredBanner: 'अपूर्ण उत्पादन मसुदा सापडला',
    draftRestoredDesc: 'तुम्ही मागील वेळी अर्धवट सोडलेले उत्पादन पूर्ण करू शकता.',
    resumeDraft: 'मसुदा सुरू ठेवा',
    discardDraft: 'मसुदा रद्द करा',
    craftedWith: 'भारतीय कारागिरांसाठी अभिमानाने बनवले',
    supportBannerText: 'कोणतीही अडचण आल्यास मदतीसाठी वरील मदत बटण दाबा.',
    liveOnline: 'थेट ऑनलाइन',
    privateStore: 'अप्रकाशित',
    testOpenStore: 'दुकान तपासा',
    editBtn: 'बदला',
    closeBtn: 'बंद करा',
    printBtn: 'प्रिंट करा',
    downloadQR: 'QR डाउनलोड करा',
    scanQR: 'QR स्कॅन करा',
    shareStore: 'दुकान शेअर करा',
    qrPageTitle: 'आपल्या दुकानाचा QR कोड',
    qrPageDesc: 'हा QR कोड ग्राहक थेट स्कॅन करून आपल्या डिजिटल दुकानात पोहोचू शकतात.',
    qrPlacementTip1: 'उत्पादन पॅकेजिंग आणि बॉक्सवर लावा 📦',
    qrPlacementTip2: 'आपल्या दुकानाच्या प्रवेशद्वारावर किंवा काउंटरवर लावा 🏪',
    qrPlacementTip3: 'प्रदर्शन आणि हस्तकला मेळाव्यात स्टॉलवर ठेवा 🎪',
    enquiriesTitle: 'ग्राहक संदेश व चौकशी',
    enquiriesSubtitle: 'आपल्या डिजिटल दुकानातून आलेली विचारणा',
    newBadge: 'नवीन',
    contactedBadgeLabel: 'संपर्क झाला',
    markContacted: 'संपर्क झाला म्हणून चिन्हांकित करा',
    filterAll: 'सर्व',
    filterNew: 'नवीन',
    filterContacted: 'संपर्क झालेले',
    newEnquiriesCount: 'नवीन चौकशी',
    noEnquiriesTitle: 'अद्याप कोणतेही संदेश नाहीत',
    noEnquiriesDesc: 'ग्राहक आपल्या दुकानात चौकशी करतील तेव्हा येथे दिसेल.',
    noFilterMatch: 'या श्रेणीत कोणतेही संदेश नाहीत.',
    enquiryProduct: 'उत्पादन',
    storefrontNotFound: 'दुकान सापडले नाही',
    wizardStep1Title: 'पायरी १: उत्पादनाचा फोटो',
    wizardStep1Desc: 'आपल्या कलेचा स्वच्छ फोटो निवडा किंवा काढा',
    wizardStep2Title: 'पायरी २: आवाजात माहिती सांगा',
    wizardStep2Desc: 'माइकवर टॅप करून मातृभाषेत सांगा किंवा टाइप करा',
    takePhotoBtn: 'फोटो काढा',
    chooseGalleryBtn: 'गॅलरीतून निवडा',
    listening: 'ऐकत आहे... बोला...',
    orTypeDetails: 'किंवा येथे टाइप करा',
    typePlaceholder: 'उदा. हा हातमाग कॉटन दुपट्टा आहे, नैसर्गिक रंगांचा वापर केला आहे...',
    whatYouToldUs: 'तुम्ही सांगितलेली माहिती:',
    recordAgainBtn: 'पुन्हा बोला',
    generateCatalogBtn: '✨ AI कॅटलॉग बनवा',
    generatingCatalogTitle: 'डिजिटल कॅटलॉग तयार होत आहे...',
    generatingCatalogDesc: 'AI आपल्या वर्णनाचे व्यावसायिक कॅटलॉगमध्ये रूपांतर करत आहे.',
    saveCatalogBtn: 'कॅटलॉग सहेजा',
    savingCatalogBtn: 'सहेजत आहे...',
    regenerateBtn: 'पुन्हा तयार करा',
    doneEditingBtn: 'बदल पूर्ण झाले',
    returnToDashboard: 'डॅशबोर्डवर परत जा',
    aiCatalogTitle: 'उत्पादन डिजिटल कॅटलॉग',
    aiGeneratedBadge: 'AI द्वारे तयार केले',
    aiGeneratedNotice: 'ही माहिती AI ने तयार केली आहे. आपण आवश्यकतेनुसार बदल करू शकता.',
    rawInputBadge: 'आपले मूळ इनपुट',
    rawInputExplanation: 'तुम्ही जे बोललात किंवा लिहिले ते येथे सुरक्षित आहे.',
    aiPriceGuidance: 'AI किंमत मार्गदर्शन',
    productStatusTitle: 'उत्पादन स्थिती',
    photoAdded: 'फोटो जोडला',
    statusPhotoAdded: 'फोटो तयार',
    statusAiCatalogReady: 'कॅटलॉग तयार',
    statusPriceReady: 'किंमत मार्गदर्शन उपलब्ध',
    statusBuyersReady: 'खरेदीदार मॅच तयार',
    statusStorePublished: 'दुकानात प्रकाशित',
    titleField: 'उत्पादनाचे शीर्षक',
    descriptionField: 'तपशीलवार वर्णन',
    craftTypeField: 'कलेचा प्रकार',
    categoryField: 'श्रेणी',
    materialField: 'वापरलेले साहित्य',
    dimensionsField: 'आकार / माप',
    productionTimeField: 'बनवण्यासाठी लागणारा वेळ',
    priceField: 'किंमत (₹)',
    tagsField: 'टॅग्स',
    artisanStoryField: 'कारागिराची गोष्ट',
    notSpecified: 'नमूद केलेले नाही',
    errorGeneric: 'काहीतरी त्रुटी आली. कृपया पुन्हा प्रयत्न करा.',
    tryAgain: 'पुन्हा प्रयत्न करा',
    helpModalTitle: 'कारीगर AI मदत केंद्र',
    helpModalDesc: 'आम्ही आपल्या व्यवसायाला डिजिटल करण्यासाठी सोबत आहोत.',
    helpAddProduct: 'नवे उत्पादन कसे जोडावे?',
    helpTopicAddProduct: 'नवे उत्पादन कसे जोडावे?',
    helpTopicAddProductAnswer: 'डॅशबोर्डवर "नवे उत्पादन जोडा" वर क्लिक करा. फोटो अपलोड करा आणि माइक वापरून आपल्या भाषेत वर्णन सांगा. AI आपोआप कॅटलॉग तयार करेल.',
    helpTopicChangePrice: 'किंमत कशी बदलावी?',
    helpTopicChangePriceAnswer: 'उत्पादन पानावर जाऊन "मूल्य मार्गदर्शन" किंवा "एडिट" निवडा. तेथे साहित्य आणि मजुरी खर्च भरून योग्य किंमत सेट करा.',
    helpTopicShareShop: 'दुकान ग्राहकांना कसे पाठवावे?',
    helpTopicShareShopAnswer: 'डॅशबोर्डवरील "माझी दुकान" मध्ये जा. तेथील QR कोड डाउनलोड करा किंवा "WhatsApp वर शेअर करा" वर क्लिक करून लिंक पाठवा.',
    helpTopicContactBuyer: 'खरेदीदारांशी कसा संपर्क करावा?',
    helpTopicContactBuyerAnswer: 'उत्पादनासाठी खरेदीदार मॅचेस सूचीमध्ये "संपर्क करा" बटण दाबा. थेट खरेदीदारांची माहिती आणि स्वारस्य नोंदवले जाईल.',
    voiceHelpTitle: 'आवाजाने मदत विचारा',
    voiceHelpDesc: 'माइक दाबा आणि विचारा उदा. "उत्पादन कसे जोडावे?"',
    voiceHelpUnsupported: 'आपल्या ब्राउझरमध्ये व्हॉइस ओळख उपलब्ध नाही. कृपया पर्यायांवर क्लिक करा.',
  },
  hi: {
    appTitle: 'कारीगर AI',
    help: 'मदद',
    dashboard: 'डैशबोर्ड',
    welcomeGreeting: 'स्वागत है',
    whatToDoToday: 'आज आप क्या करना चाहते हैं?',
    addProduct: 'उत्पाद जोड़ें',
    addProductCardTitle: 'नया उत्पाद जोड़ें',
    addProductCardDesc: 'फोटो और आवाज़ से डिजिटल कैटलॉग बनाएं',
    findBuyersCardTitle: 'खरीदार खोजें',
    findBuyersCardDesc: 'थोक और खुदरा खरीदारों से सीधे जुड़ें',
    myStore: 'मेरी दुकान',
    myStoreCardTitle: 'मेरी डिजिटल दुकान',
    myStoreCardDesc: 'अपने उत्पाद दुनिया भर के ग्राहकों को दिखाएं',
    messagesCardTitle: 'ग्राहक संदेश',
    messagesCardDesc: 'नई पूछताछ और ग्राहकों के संदेश देखें',
    activeProductsTitle: 'सक्रिय उत्पाद',
    noProductsTitle: 'कोई उत्पाद नहीं जोड़ा गया',
    noProductsDesc: 'अपना पहला उत्पाद जोड़कर शुरुआत करें',
    addFirstProductBtn: 'पहला उत्पाद जोड़ें',
    quickSharingActions: 'त्वरित शेयर',
    showQR: 'QR कोड दिखाएं',
    openStore: 'दुकान खोलें',
    copyStoreUrl: 'दुकान लिंक कॉपी करें',
    storeUrlCopied: 'दुकान लिंक कॉपी हो गई!',
    linkCopied: 'लिंक कॉपी हो गई!',
    copyLink: 'लिंक कॉपी करें',
    draftRestoredBanner: 'अधूरा उत्पाद ड्राफ्ट मिला',
    draftRestoredDesc: 'आप पिछली बार अधूरा छोड़ा गया उत्पाद पूरा कर सकते हैं।',
    resumeDraft: 'ड्राफ्ट जारी रखें',
    discardDraft: 'ड्राफ्ट हटाएं',
    craftedWith: 'भारतीय कारीगरों के लिए गर्व से निर्मित',
    supportBannerText: 'किसी भी सहायता के लिए ऊपर दिए गए मदद बटन पर टैप करें।',
    liveOnline: 'लाइव ऑनलाइन',
    privateStore: 'अप्रकाशित',
    testOpenStore: 'दुकान देखें',
    editBtn: 'संपादित करें',
    closeBtn: 'बंद करें',
    printBtn: 'प्रिंट करें',
    downloadQR: 'QR डाउनलोड करें',
    scanQR: 'QR स्कैन करें',
    shareStore: 'दुकान शेयर करें',
    qrPageTitle: 'आपकी दुकान का QR कोड',
    qrPageDesc: 'ग्राहक इस QR कोड को स्कैन करके सीधे आपकी ऑनलाइन दुकान देख सकते हैं।',
    qrPlacementTip1: 'उत्पाद पैकेजिंग और डिब्बों पर लगाएं 📦',
    qrPlacementTip2: 'अपनी दुकान के प्रवेश द्वार या काउंटर पर रखें 🏪',
    qrPlacementTip3: 'प्रदर्शनी और शिल्प मेलों के स्टॉल पर लगाएं 🎪',
    enquiriesTitle: 'ग्राहक संदेश और पूछताछ',
    enquiriesSubtitle: 'आपकी ऑनलाइन दुकान से आई हुई पूछताछ',
    newBadge: 'नया',
    contactedBadgeLabel: 'संपर्क किया',
    markContacted: 'संपर्क किया हुआ चिह्नित करें',
    filterAll: 'सभी',
    filterNew: 'नए',
    filterContacted: 'संपर्क किए गए',
    newEnquiriesCount: 'नई पूछताछ',
    noEnquiriesTitle: 'अभी तक कोई संदेश नहीं',
    noEnquiriesDesc: 'जब ग्राहक आपकी दुकान पर पूछताछ करेंगे, तो वे यहां दिखाई देंगे।',
    noFilterMatch: 'इस श्रेणी में कोई संदेश नहीं है।',
    enquiryProduct: 'उत्पाद',
    storefrontNotFound: 'दुकान नहीं मिली',
    wizardStep1Title: 'चरण १: उत्पाद का फोटो',
    wizardStep1Desc: 'अपने हस्तशिल्प की स्पष्ट तस्वीर चुनें या खींचें',
    wizardStep2Title: 'चरण २: बोलकर बताएं',
    wizardStep2Desc: 'माइक पर टैप करके अपनी भाषा में विवरण दें या टाइप करें',
    takePhotoBtn: 'फोटो खींचें',
    chooseGalleryBtn: 'गैलरी से चुनें',
    listening: 'सुन रहे हैं... बोलिए...',
    orTypeDetails: 'या यहाँ टाइप करें',
    typePlaceholder: 'उदा. यह हाथ से बना मिट्टी का दीया है, प्राकृतिक रंगों का प्रयोग किया गया है...',
    whatYouToldUs: 'आपने जो बताया:',
    recordAgainBtn: 'फिर से बोलें',
    generateCatalogBtn: '✨ AI कैटलॉग बनाएं',
    generatingCatalogTitle: 'डिजिटल कैटलॉग तैयार हो रहा है...',
    generatingCatalogDesc: 'AI आपके विवरण को व्यावसायिक कैटलॉग में बदल रहा है।',
    saveCatalogBtn: 'कैटलॉग सहेजें',
    savingCatalogBtn: 'सहेज रहे हैं...',
    regenerateBtn: 'फिर से बनाएं',
    doneEditingBtn: 'संपादन पूर्ण',
    returnToDashboard: 'डैशबोर्ड पर लौटें',
    aiCatalogTitle: 'डिजिटल उत्पाद कैटलॉग',
    aiGeneratedBadge: 'AI द्वारा निर्मित',
    aiGeneratedNotice: 'यह विवरण AI द्वारा तैयार किया गया है। आप आवश्यकतानुसार बदलाव कर सकते हैं।',
    rawInputBadge: 'आपका मूल इनपुट',
    rawInputExplanation: 'जो आपने बोला या लिखा था, वह यहाँ सुरक्षित है।',
    aiPriceGuidance: 'AI मूल्य मार्गदर्शन',
    productStatusTitle: 'उत्पाद की स्थिति',
    photoAdded: 'फोटो जोड़ा गया',
    statusPhotoAdded: 'फोटो तैयार',
    statusAiCatalogReady: 'कैटलॉग तैयार',
    statusPriceReady: 'मूल्य मार्गदर्शन उपलब्ध',
    statusBuyersReady: 'खरीदार मैच उपलब्ध',
    statusStorePublished: 'दुकान में प्रकाशित',
    titleField: 'उत्पाद का शीर्षक',
    descriptionField: 'विस्तृत विवरण',
    craftTypeField: 'कला का प्रकार',
    categoryField: 'श्रेणी',
    materialField: 'इस्तेमाल की गई सामग्री',
    dimensionsField: 'आकार / माप',
    productionTimeField: 'बनाने में लगा समय',
    priceField: 'कीमत (₹)',
    tagsField: 'टैग्स',
    artisanStoryField: 'कारीगर की कहानी',
    notSpecified: 'उल्लेखित नहीं',
    errorGeneric: 'कोई त्रुटि हुई। कृपया पुनः प्रयास करें।',
    tryAgain: 'पुनः प्रयास करें',
    helpModalTitle: 'कारीगर AI सहायता केंद्र',
    helpModalDesc: 'हम आपके शिल्प व्यवसाय को डिजिटल बनाने में हमेशा साथ हैं।',
    helpAddProduct: 'नया उत्पाद कैसे जोड़ें?',
    helpTopicAddProduct: 'नया उत्पाद कैसे जोड़ें?',
    helpTopicAddProductAnswer: 'डैशबोर्ड पर "नया उत्पाद जोड़ें" पर क्लिक करें। फोटो अपलोड करें और माइक से विवरण बोलें। AI अपने आप कैटलॉग तैयार कर देगा।',
    helpTopicChangePrice: 'कीमत कैसे बदलें?',
    helpTopicChangePriceAnswer: 'उत्पाद पृष्ठ पर "मूल्य मार्गदर्शन" चुनें। वहाँ सामग्री और श्रम लागत दर्ज करके उचित मूल्य निर्धारित करें।',
    helpTopicShareShop: 'दुकान ग्राहकों को कैसे भेजें?',
    helpTopicShareShopAnswer: 'डैशबोर्ड में "मेरी दुकान" पर जाएं। वहाँ से QR कोड डाउनलोड करें या सीधे WhatsApp पर लिंक साझा करें।',
    helpTopicContactBuyer: 'खरीदारों से कैसे संपर्क करें?',
    helpTopicContactBuyerAnswer: 'उत्पाद के खरीदार मैचों में "संपर्क करें" बटन दबाएं। खरीदार की आवश्यकता के अनुसार रुचि दर्ज हो जाएगी।',
    voiceHelpTitle: 'बोलकर मदद मांगें',
    voiceHelpDesc: 'माइक दबाएं और कहें उदा. "उत्पाद कैसे जोड़ें?"',
    voiceHelpUnsupported: 'आपके ब्राउज़र में आवाज़ पहचान उपलब्ध नहीं है। कृपया सूची में से विकल्प चुनें।',
  },
  en: {
    appTitle: 'Karigar AI',
    help: 'Help',
    dashboard: 'Dashboard',
    welcomeGreeting: 'Welcome',
    whatToDoToday: 'What would you like to do today?',
    addProduct: 'Add Product',
    addProductCardTitle: 'Add New Product',
    addProductCardDesc: 'Create a digital catalog with a photo & voice note',
    findBuyersCardTitle: 'Find Buyers',
    findBuyersCardDesc: 'Connect with verified wholesale and boutique buyers',
    myStore: 'My Store',
    myStoreCardTitle: 'My Digital Store',
    myStoreCardDesc: 'Showcase your handcrafted creations to customers worldwide',
    messagesCardTitle: 'Customer Messages',
    messagesCardDesc: 'View incoming customer enquiries and WhatsApp leads',
    activeProductsTitle: 'Active Products',
    noProductsTitle: 'No products added yet',
    noProductsDesc: 'Start your journey by adding your first handcrafted product',
    addFirstProductBtn: 'Add First Product',
    quickSharingActions: 'Quick Share',
    showQR: 'Show QR Code',
    openStore: 'Open Store',
    copyStoreUrl: 'Copy Store Link',
    storeUrlCopied: 'Store link copied!',
    linkCopied: 'Link copied!',
    copyLink: 'Copy Link',
    draftRestoredBanner: 'Unsaved Product Draft Found',
    draftRestoredDesc: 'You have an unfinished product draft saved on this device.',
    resumeDraft: 'Resume Draft',
    discardDraft: 'Discard Draft',
    craftedWith: 'Proudly crafted for traditional Indian artisans',
    supportBannerText: 'Need assistance? Tap the Help button above anytime.',
    liveOnline: 'Live Online',
    privateStore: 'Private',
    testOpenStore: 'Preview Store',
    editBtn: 'Edit',
    closeBtn: 'Close',
    printBtn: 'Print',
    downloadQR: 'Download QR',
    scanQR: 'Scan QR',
    shareStore: 'Share Store',
    qrPageTitle: 'Your Storefront QR Card',
    qrPageDesc: 'Customers can scan this QR code directly with any smartphone to open your digital shop.',
    qrPlacementTip1: 'Stick onto product packaging and boxes 📦',
    qrPlacementTip2: 'Display at your workshop entrance or cash desk 🏪',
    qrPlacementTip3: 'Stand at craft exhibitions and artisan melas 🎪',
    enquiriesTitle: 'Customer Inquiries & Messages',
    enquiriesSubtitle: 'Direct inquiries received from your digital storefront',
    newBadge: 'New',
    contactedBadgeLabel: 'Contacted',
    markContacted: 'Mark as Contacted',
    filterAll: 'All',
    filterNew: 'New',
    filterContacted: 'Contacted',
    newEnquiriesCount: 'New Enquiries',
    noEnquiriesTitle: 'No customer messages yet',
    noEnquiriesDesc: 'Inquiries submitted by store visitors will appear here.',
    noFilterMatch: 'No inquiries found matching this filter.',
    enquiryProduct: 'Product',
    storefrontNotFound: 'Storefront Not Found',
    wizardStep1Title: 'Step 1: Product Photo',
    wizardStep1Desc: 'Upload or snap a clear photo of your handcrafted item',
    wizardStep2Title: 'Step 2: Voice Description',
    wizardStep2Desc: 'Tap the mic to describe in your native language or type below',
    takePhotoBtn: 'Take Photo',
    chooseGalleryBtn: 'Choose Photo',
    listening: 'Listening... please speak...',
    orTypeDetails: 'Or type details here',
    typePlaceholder: 'e.g., Handcrafted Warli painting on canvas using natural cow dung and rice paste colors...',
    whatYouToldUs: 'What You Told Us:',
    recordAgainBtn: 'Record Again',
    generateCatalogBtn: '✨ Generate AI Catalog',
    generatingCatalogTitle: 'Synthesizing Digital Catalog...',
    generatingCatalogDesc: 'AI is organizing your description into professional marketplace specifications.',
    saveCatalogBtn: 'Save Catalog',
    savingCatalogBtn: 'Saving...',
    regenerateBtn: 'Regenerate',
    doneEditingBtn: 'Done Editing',
    returnToDashboard: 'Return to Dashboard',
    aiCatalogTitle: 'Digital Product Catalog',
    aiGeneratedBadge: 'AI Generated',
    aiGeneratedNotice: 'This listing was synthesized by AI. Review and edit any details before publishing.',
    rawInputBadge: 'Raw Artisan Input',
    rawInputExplanation: 'Your original spoken words or typed notes are preserved here.',
    aiPriceGuidance: 'AI Price Guidance',
    productStatusTitle: 'Product Status',
    photoAdded: 'Photo Added',
    statusPhotoAdded: 'Photo uploaded',
    statusAiCatalogReady: 'AI Catalog ready',
    statusPriceReady: 'Price guidance available',
    statusBuyersReady: 'Buyer matches found',
    statusStorePublished: 'Published in store',
    titleField: 'Product Title',
    descriptionField: 'Detailed Description',
    craftTypeField: 'Craft Type',
    categoryField: 'Category',
    materialField: 'Materials Used',
    dimensionsField: 'Dimensions / Size',
    productionTimeField: 'Production Time',
    priceField: 'Price (₹)',
    tagsField: 'Tags',
    artisanStoryField: 'Artisan Story',
    notSpecified: 'Not specified',
    errorGeneric: 'An error occurred. Please try again.',
    tryAgain: 'Try Again',
    helpModalTitle: 'Karigar AI Help Center',
    helpModalDesc: 'We are here to support your artisan business every step of the way.',
    helpAddProduct: 'How to add a new product?',
    helpTopicAddProduct: 'How to add a new product?',
    helpTopicAddProductAnswer: 'Tap "Sell New Product" on your dashboard. Upload a photo, then tap the microphone to describe materials and effort in your own language. AI creates the catalog automatically.',
    helpTopicChangePrice: 'How to price my craft?',
    helpTopicChangePriceAnswer: 'Open your product and go to Price Guidance. Enter your raw material cost and labor hours to receive fair market price recommendations.',
    helpTopicShareShop: 'How to share my store with customers?',
    helpTopicShareShopAnswer: 'Visit "My Store" from the dashboard. You can download the printable QR card or tap "Share on WhatsApp" to send product links directly to customers.',
    helpTopicContactBuyer: 'How to connect with buyers?',
    helpTopicContactBuyerAnswer: 'Under "Buyer Matches", review compatible B2B buyers and tap "Contact Buyer" to log your outreach and establish contact.',
    voiceHelpTitle: 'Voice Help Assistant',
    voiceHelpDesc: 'Tap the mic and ask a question (e.g. "How do I add a product?")',
    voiceHelpUnsupported: 'Speech recognition is not supported in this browser. Please tap any topic above.',
  },
};
