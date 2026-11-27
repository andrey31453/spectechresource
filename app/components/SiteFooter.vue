<script setup lang="ts">
import type { HomeDto, SiteDto } from "~/types/catalog";
import { categoryPath, servicePath } from "~/utils/routes";

const props = defineProps<{ site: SiteDto }>();
const { data: content } = await useFetch<HomeDto>("/api/home", { key: "footer-content" });
const categories = computed(() => content.value?.categories ?? []);
const services = computed(() => content.value?.services ?? []);
const equipmentTypes = computed(() => categories.value.flatMap(category =>
  category.types.map(type => ({ slug: type.slug, name: type.name })),
));

const year = new Date().getFullYear();

/** Ссылка подвала: приглушённый цвет, бренд на наведении. */
const link = "inline-flex min-h-6 items-center text-mist transition-colors hover:text-flame2 focus-visible:outline-flame2 motion-reduce:transition-none";

const messengers = computed(() =>
  [
    { label: "Telegram", href: props.site.telegram },
    { label: "WhatsApp", href: props.site.whatsapp },
    { label: "MAX", href: props.site.maxMessenger },
  ].filter((item): item is { label: string; href: string } => Boolean(item.href)),
);

const requisites = computed(() =>
  [
    props.site.legalName,
    props.site.inn ? `ИНН ${props.site.inn}` : null,
    props.site.ogrn ? `ОГРН ${props.site.ogrn}` : null,
  ].filter((item): item is string => Boolean(item)),
);
</script>

<template>
  <footer id="zayavka" data-site-footer class="relative isolate border-t border-line-dark bg-night py-20! text-sm text-snow [&_a]:-mx-2 [&_a]:rounded-field [&_a]:px-2 [&_a:hover]:bg-flame/10 [&_a:hover]:no-underline! md:py-28! lg:border-t-0 xl:py-32!">
    <div class="stars-bg" aria-hidden="true">
      <div class="stars stars--far" />
      <div class="stars stars--mid" />
      <div class="stars stars--near" />
      <div class="stars stars--spark" />
      <div class="stars stars--giant" />
    </div>
    <div class="mx-auto max-w-site px-5 md:px-8">
      <div data-footer-columns class="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.4fr)_minmax(0,1fr)] lg:gap-8 xl:gap-12">
        <div data-footer-catalog class="flex min-w-0 flex-col items-start">
          <h2 class="m-0 text-xl font-bold text-snow">Каталог техники</h2>
          <nav aria-label="Каталог в подвале" class="mt-6 flex flex-col items-start gap-2">
            <NuxtLink v-for="category in categories" :key="category.slug" :to="categoryPath(category.slug)" :class="link">{{ category.title }}</NuxtLink>
            <NuxtLink to="/katalog" :class="[link, 'mt-2 font-semibold text-snow']">Весь каталог →</NuxtLink>
          </nav>
          <nav v-if="services.length" aria-label="Услуги в подвале" class="mt-10 flex w-full flex-col items-start gap-2 pt-6 lg:mt-auto">
            <NuxtLink v-for="service in services" :key="service.slug" :to="servicePath(service.slug)" :class="link">{{ service.title }}</NuxtLink>
          </nav>
        </div>
        <div data-footer-form class="stars-lead-form min-w-0 [&_form]:p-6! [&_form>div.grid]:mt-7! [&_form>div.grid]:gap-6! [&_form>div.grid>div.grid]:gap-6! [&_form>button]:mt-7! sm:[&_form]:p-8! xl:[&_form]:p-10!">
          <LeadForm place="callback" :equipment-types="equipmentTypes" :phone="site.phone" heading="Оставьте заявку" lead="Укажите контакты и задачу — уточним наличие, стоимость и сроки подачи." submit-label="Получить расчёт" />
        </div>
        <div data-footer-contacts class="flex min-w-0 flex-col items-start border-t border-line-dark pt-8 lg:border-t-0 lg:pt-0 lg:pl-8 xl:pl-10">
          <SiteBrand />
          <h2 class="mt-7 mb-0 text-xl font-bold text-snow">Свяжитесь с нами</h2>
          <ul class="mt-5 space-y-4 break-words">
            <li><a :href="telHref(site.phone)" :class="[link, 'text-lg font-bold text-snow']">{{ site.phone }}</a></li>
            <li v-if="site.email"><a :href="`mailto:${site.email}`" :class="link">{{ site.email }}</a></li>
            <li v-if="site.workingHours" class="text-mist">{{ site.workingHours }}</li>
            <li class="leading-relaxed text-mist">{{ site.address || `Работаем в ${site.city.nameIn} и по области` }}</li>
          </ul>
          <div v-if="messengers.length" class="mt-5 flex flex-wrap gap-x-4 gap-y-2">
            <a v-for="item in messengers" :key="item.label" :href="item.href" rel="noopener" :class="link">{{ item.label }}</a>
          </div>
          <p v-if="requisites.length" class="mt-6 mb-0 text-xs leading-relaxed text-mist">{{ requisites.join(' · ') }}</p>
          <div data-footer-bottom class="mt-10 w-full pt-6 lg:mt-auto">
            <nav aria-label="Ссылки в подвале" class="flex flex-wrap gap-x-4 gap-y-2 pt-5">
              <NuxtLink to="/stoimost" :class="link">Стоимость</NuxtLink>
              <NuxtLink to="/uslugi" :class="link">Услуги</NuxtLink>
              <NuxtLink to="/kontakty" :class="link">Контакты</NuxtLink>
              <NuxtLink to="/politika-obrabotki-personalnyh-dannyh" :class="link">Политика ПДн</NuxtLink>
            </nav>
            <p class="mt-5 mb-0 text-xs leading-relaxed text-snow">© {{ year }} {{ site.companyName }}.</p>
          </div>
        </div>
      </div>
    </div>
  </footer>
</template>

<style scoped>
footer :deep(p) {
  margin-bottom: 0;
}

footer :deep(h2) {
  letter-spacing: -0.015em;
  text-transform: uppercase;
  text-wrap: wrap;
}

footer {
  --stars-far-field:1148px 1086px, 1982px 13px, 2247px 536px, 24px 793px, 1984px 699px, 2206px 1252px, 838px 1192px, 1475px 876px, 226px 452px, 753px 1024px, 12px 951px, 2597px 917px, 1520px 1324px, 2372px 1065px, 1950px 1005px, 1402px 373px, 837px 1167px, 111px 367px, 2166px 201px, 946px 534px, 429px 606px, 1444px 1287px, 393px 1129px, 690px 1198px, 1781px 1229px, 1000px 376px, 1743px 1211px, 880px 771px, 1381px 124px, 1863px 754px, 401px 560px, 181px 210px, 765px 78px, 1232px 630px, 1048px 476px, 2288px 503px, 239px 501px, 2248px 1045px, 1167px 112px, 1769px 347px, 331px 1061px, 195px 470px, 865px 955px, 1315px 935px, 1181px 976px, 2265px 536px, 747px 1127px, 248px 544px, 928px 921px, 2208px 869px, 1759px 1237px, 654px 1289px, 89px 720px, 1962px 283px, 2526px 1138px, 1779px 990px, 2223px 857px, 127px 1223px, 1892px 916px, 2665px 1189px, 1710px 163px, 1077px 706px, 2367px 565px, 2641px 1120px, 987px 31px, 1541px 633px, 272px 678px, 998px 1071px, 805px 484px, 2079px 424px, 1990px 726px, 1213px 1102px, 2433px 971px, 1759px 638px, 1738px 763px, 2463px 1103px, 456px 657px, 1156px 174px, 1208px 328px, 18px 392px, 399px 494px, 1581px 966px, 2495px 171px, 2198px 688px, 2502px 205px, 902px 371px, 911px 748px, 2506px 600px, 563px 163px, 2520px 1326px, 103px 1294px, 367px 693px, 901px 1308px, 1094px 1120px, 1253px 365px, 1850px 431px, 866px 796px, 556px 902px, 588px 329px, 1066px 919px, 2217px 539px, 1284px 1193px, 2028px 374px, 2374px 1330px, 1563px 207px, 1897px 236px, 1956px 975px, 1778px 1244px, 356px 1045px, 725px 1127px, 2270px 151px, 1482px 590px, 2684px 134px, 770px 830px, 977px 330px, 1035px 258px, 663px 452px, 1529px 1370px, 1212px 914px, 153px 799px, 101px 682px, 170px 1119px, 128px 506px, 2123px 545px, 2377px 656px, 1457px 952px, 194px 1344px, 982px 851px, 854px 199px, 1675px 306px, 1482px 490px, 2465px 1288px, 9px 377px, 2028px 110px, 178px 681px, 2617px 998px, 2104px 1036px, 906px 698px, 1909px 1313px, 2646px 1354px, 1045px 1184px, 256px 849px, 822px 184px, 1345px 68px, 2532px 1083px, 2120px 49px, 1547px 1278px, 2704px 1009px, 456px 341px, 2513px 843px, 609px 874px, 500px 1152px, 918px 617px, 1916px 512px, 423px 839px, 1425px 1397px, 2014px 1080px, 1787px 804px, 673px 1235px, 440px 357px, 1067px 788px, 394px 678px, 2248px 1174px, 2637px 42px, 1150px 551px, 2450px 516px, 624px 1264px, 259px 314px, 1002px 1238px, 939px 582px, 840px 1364px, 943px 480px, 221px 705px, 1590px 301px, 112px 564px, 404px 366px, 1860px 741px, 1303px 427px, 2750px 907px, 1810px 1367px, 1219px 1212px, 1955px 1091px, 311px 141px, 1679px 887px, 2496px 1000px, 1295px 694px, 568px 577px, 2410px 96px, 1035px 1247px, 1589px 1189px, 1300px 127px, 1779px 839px, 1482px 352px, 262px 1277px, 1790px 891px, 48px 677px, 900px 1270px, 1540px 529px, 987px 1330px, 1805px 1199px, 1317px 855px, 242px 738px, 2566px 1134px, 471px 910px, 1479px 1104px, 531px 1319px, 1460px 242px, 1821px 697px, 50px 425px, 734px 909px, 1132px 955px, 1606px 932px, 2177px 395px, 1269px 279px, 1944px 930px, 43px 253px, 2339px 1270px, 256px 616px, 2539px 491px, 2156px 422px, 1138px 593px, 2065px 1268px, 2683px 1077px, 1308px 1267px, 481px 1117px, 151px 1042px, 489px 1257px, 2346px 214px, 1657px 131px, 212px 73px, 1275px 348px, 1326px 1113px, 2435px 224px, 1494px 1306px, 2230px 163px, 830px 447px, 136px 577px, 1152px 121px, 720px 84px, 631px 1286px, 2359px 227px, 459px 1027px, 89px 118px, 2541px 884px, 2708px 628px, 2662px 328px, 1952px 1195px, 853px 1146px, 732px 431px, 195px 858px, 2193px 242px, 520px 846px, 1043px 1019px, 1284px 196px, 497px 639px, 2611px 205px, 1075px 636px, 179px 1176px, 1801px 681px, 1462px 257px, 41px 800px, 703px 125px, 2164px 1219px, 688px 138px, 602px 1115px, 1603px 1282px, 2590px 975px, 1174px 753px, 1824px 37px, 1263px 806px, 1215px 710px, 734px 368px, 1792px 1167px, 1626px 810px, 1478px 656px, 2001px 1074px, 1247px 1186px, 58px 1245px, 1068px 862px, 2368px 1244px, 2104px 1167px, 2105px 191px, 325px 314px, 2345px 1301px, 1484px 291px, 1928px 141px, 691px 1250px, 2308px 240px, 1283px 449px, 2649px 825px, 1118px 228px, 2229px 188px, 1967px 326px, 2300px 773px, 94px 301px, 2141px 928px, 2188px 913px, 1545px 701px, 965px 218px, 94px 1332px, 725px 1271px, 1074px 505px, 1807px 435px, 1490px 725px, 572px 714px, 1329px 209px, 1588px 1372px, 427px 1084px, 2252px 142px, 63px 131px, 2269px 993px, 143px 695px, 2394px 1089px, 8px 147px, 123px 1363px, 2346px 813px, 1494px 1149px, 678px 481px, 1496px 1288px, 2502px 1069px, 2375px 1204px, 2759px 1183px, 273px 777px, 2189px 757px, 1152px 490px, 414px 813px, 2790px 1261px, 2526px 1199px, 1947px 704px, 445px 282px, 1836px 811px, 2583px 230px, 2494px 1212px, 2316px 1399px, 265px 241px, 2180px 358px, 2140px 1257px, 2707px 525px, 1299px 402px, 1277px 665px;
  --stars-mid-field:2580px 156px, 2577px 1240px, 376px 66px, 628px 295px, 2268px 654px, 2392px 502px, 836px 1172px, 1571px 31px, 439px 1188px, 2045px 198px, 1268px 909px, 2088px 1197px, 1371px 414px, 2681px 583px, 2708px 37px, 1234px 923px, 2736px 975px, 300px 503px, 1469px 1353px, 2490px 1321px, 2141px 1275px, 94px 299px, 1758px 405px, 952px 1138px, 1070px 462px, 2423px 724px, 605px 1288px, 461px 716px, 478px 397px, 716px 102px, 2098px 863px, 2500px 995px, 525px 869px, 406px 737px, 1546px 1016px, 2271px 349px, 1847px 1033px, 840px 1354px, 644px 96px, 674px 1242px, 2574px 1015px, 1476px 479px, 1465px 1147px, 158px 301px, 1456px 953px, 358px 247px, 1420px 210px, 2073px 1051px, 749px 111px, 1968px 1366px, 841px 73px, 1242px 1040px, 212px 174px, 1274px 722px, 1801px 221px, 35px 491px, 42px 698px, 939px 1368px, 321px 674px, 1175px 1125px, 2454px 1204px, 452px 481px, 1165px 603px, 377px 839px, 887px 329px, 1241px 632px, 246px 54px, 2602px 1151px, 1329px 419px, 9px 329px, 2690px 1240px, 1311px 321px, 2406px 949px, 2574px 702px, 340px 1100px, 1093px 738px, 856px 708px, 2427px 128px, 1884px 1300px, 1111px 472px, 268px 492px, 114px 27px, 1590px 1091px, 1317px 936px, 1364px 1167px, 1301px 446px, 1072px 710px, 683px 1053px, 1348px 699px, 824px 154px, 969px 1089px, 1028px 163px, 270px 1399px, 446px 1227px, 2525px 594px, 2553px 1378px, 297px 1138px, 2087px 873px, 2529px 199px, 2773px 975px, 2080px 1152px, 937px 300px, 1537px 1275px, 2132px 1287px, 555px 725px, 1317px 1377px, 1425px 851px, 860px 378px, 132px 254px, 22px 603px, 2359px 1034px, 2031px 576px, 1346px 461px, 1340px 348px, 379px 353px, 1305px 559px, 490px 299px, 1950px 426px, 374px 924px, 246px 1384px, 1144px 338px, 2658px 563px, 317px 792px, 1840px 928px, 255px 455px, 1150px 637px, 10px 1137px, 2688px 1000px, 2055px 317px, 2667px 411px, 1921px 761px, 2755px 1034px, 1908px 1255px, 2493px 883px, 317px 46px, 2069px 646px, 1465px 9px, 1702px 484px, 1234px 454px, 1901px 274px, 799px 897px, 2281px 515px, 1451px 436px, 2232px 695px, 1074px 608px, 1407px 334px, 2004px 785px, 400px 1111px, 2421px 49px, 1617px 923px, 1414px 1279px, 1851px 1345px, 338px 22px, 1926px 253px, 1141px 196px, 223px 137px, 389px 461px, 605px 754px, 2146px 1205px, 325px 592px, 639px 262px, 1951px 1084px, 1505px 614px, 971px 1366px, 1678px 267px, 478px 1101px, 559px 445px, 2675px 530px, 270px 704px, 2190px 382px, 164px 1175px, 1966px 1284px, 1757px 440px, 1890px 725px, 269px 69px, 1344px 300px, 2192px 70px, 538px 288px, 1195px 614px, 1591px 99px, 2385px 1031px, 871px 714px, 1404px 563px, 2121px 394px, 2227px 279px, 445px 1106px, 1758px 465px, 1970px 299px, 2538px 518px, 2435px 652px, 2277px 1191px, 2438px 403px, 2425px 451px, 1467px 1299px, 493px 687px, 2473px 1367px, 1807px 1364px, 775px 785px, 1687px 1394px, 1310px 373px, 1554px 605px, 1665px 550px, 108px 1144px, 2445px 1257px, 580px 417px, 83px 809px, 971px 75px, 46px 338px, 1689px 121px, 2639px 1271px, 468px 883px, 2309px 782px, 366px 669px, 709px 732px, 252px 474px, 1817px 1003px, 1569px 1116px, 446px 260px, 933px 1349px, 744px 1268px, 20px 25px, 1696px 1136px, 1034px 1193px, 1029px 889px, 530px 466px, 1617px 1149px, 1732px 1260px, 1974px 610px, 1254px 305px, 2170px 410px, 391px 248px, 1309px 1081px, 115px 460px, 1299px 2px, 475px 1241px, 873px 188px, 848px 1323px, 2156px 1317px, 15px 226px, 1786px 375px, 1983px 194px, 1455px 280px, 2128px 1028px, 188px 1317px, 101px 609px, 2192px 587px, 2102px 507px, 1171px 1059px, 139px 413px, 263px 344px, 339px 1328px, 2376px 870px, 1384px 971px, 2726px 590px, 1083px 157px, 1149px 147px, 1052px 1381px, 800px 342px, 1504px 424px, 1610px 1206px, 738px 1358px, 211px 268px, 2767px 1302px, 2093px 1314px, 1752px 148px, 783px 255px, 2251px 1291px, 1736px 1325px, 1140px 325px, 1230px 155px, 2404px 466px, 2123px 732px, 2548px 1113px, 2010px 1089px, 1322px 125px, 879px 377px, 2027px 851px, 1409px 185px, 122px 541px, 2323px 437px;
  --stars-near-field:2441px 149px, 1414px 759px, 1755px 1166px, 1587px 1214px, 2268px 5px, 1963px 178px, 1419px 461px, 831px 254px, 2056px 999px, 2167px 394px, 446px 473px, 1672px 934px, 1656px 147px, 1974px 1249px, 891px 1188px, 335px 104px, 1109px 1276px, 728px 21px, 195px 682px, 382px 724px, 948px 1141px, 2675px 596px, 1844px 72px, 801px 258px, 2519px 730px, 2256px 1119px, 1355px 1263px, 2382px 464px, 883px 1137px, 1345px 141px, 1352px 604px, 1052px 841px, 1202px 126px, 1184px 470px, 61px 1293px, 674px 1058px, 1077px 1077px, 2789px 725px, 518px 1269px, 1778px 503px, 1308px 1146px, 786px 77px, 326px 1082px, 2572px 855px, 1434px 88px, 2409px 967px, 1318px 20px, 2339px 887px, 2516px 304px, 188px 1162px, 459px 34px, 2482px 186px, 2074px 906px, 804px 760px, 37px 755px, 2139px 1109px, 462px 1251px, 2568px 440px, 72px 1023px, 92px 763px, 884px 1282px, 1495px 1005px, 2651px 706px, 1884px 455px, 1240px 1241px, 1803px 1374px, 2146px 78px, 1936px 1119px, 2332px 264px, 1682px 1245px, 2353px 243px, 2326px 1359px, 549px 515px, 2207px 38px, 192px 506px, 2129px 481px, 2036px 970px, 1585px 449px, 953px 1256px, 9px 235px, 1283px 388px, 359px 148px, 1133px 749px, 1529px 81px, 2111px 537px, 1615px 481px, 202px 22px, 831px 673px, 575px 273px, 363px 427px, 1390px 585px, 107px 352px, 2283px 1345px, 1320px 169px, 1403px 1024px, 2041px 100px, 2697px 845px, 2682px 205px, 1362px 749px, 1204px 1043px, 1956px 1109px, 2469px 278px, 32px 13px, 2734px 105px, 827px 30px, 2401px 283px, 2789px 1189px, 2241px 606px, 2120px 1188px, 730px 430px, 1100px 1145px, 861px 1051px, 2622px 110px, 761px 1069px, 1131px 1137px, 273px 804px, 1104px 420px, 1930px 241px, 1629px 324px, 2277px 627px, 2720px 1115px, 65px 731px, 2062px 1316px, 686px 202px, 734px 665px, 226px 1178px, 2542px 1005px, 2441px 775px, 1534px 827px, 2035px 650px, 700px 944px, 2170px 508px, 1282px 328px, 972px 28px, 1625px 901px, 2753px 1094px, 1583px 586px, 2221px 407px, 1585px 1241px, 1713px 91px, 684px 1395px, 2503px 1039px, 249px 1061px, 255px 184px, 1641px 270px, 216px 959px, 1273px 122px, 612px 1213px, 342px 1236px, 1581px 1306px, 1152px 154px, 386px 515px, 909px 145px, 1149px 386px, 757px 266px, 31px 1075px, 1960px 533px, 1468px 1011px, 776px 100px, 770px 1191px, 2392px 1278px, 1803px 1163px, 1999px 680px, 1288px 182px, 1905px 771px, 825px 1114px, 2041px 1050px, 2532px 630px, 1711px 783px, 2090px 883px;
  --stars-spark-field:2300px 1088px, 1619px 1298px, 2327px 943px, 886px 1078px, 27px 1384px, 276px 1190px, 2758px 1126px, 1174px 334px, 577px 113px, 1183px 715px, 1020px 934px, 809px 856px, 659px 1265px, 360px 572px, 329px 162px, 2539px 416px, 2750px 1288px, 361px 354px, 1839px 481px, 763px 917px, 1942px 490px, 2496px 1355px, 439px 224px, 326px 456px, 2494px 1286px, 803px 1063px;
  --stars-giant-field:2119px 845px, 672px 1028px, 79px 852px, 2692px 279px, 2360px 381px, 227px 1102px, 1821px 862px, 1847px 175px, 885px 684px, 2637px 715px, 1217px 480px, 2531px 1054px, 1400px 473px, 12px 1388px, 1889px 631px, 982px 1143px, 579px 562px, 1402px 586px;
  --stars-band:1400px;
  --stars-far-size:1px;
  --stars-far-speed:240s;
  --stars-far-opacity:.5;
  --stars-far-tint:var(--color-mist);
  --stars-mid-size:1px;
  --stars-mid-speed:180s;
  --stars-mid-opacity:.72;
  --stars-mid-tint:var(--color-snow);
  --stars-near-size:2px;
  --stars-near-speed:130s;
  --stars-near-opacity:.9;
  --stars-near-tint:var(--color-snow);
  --stars-spark-size:3px;
  --stars-spark-speed:96s;
  --stars-spark-opacity:.85;
  --stars-spark-tint:var(--color-flame);
  --stars-giant-size:4px;
  --stars-giant-speed:72s;
  --stars-giant-opacity:.92;
  --stars-giant-tint:var(--color-snow);
  --stars-glow:#ff7a2f17;}
footer{background-image:radial-gradient(120% 86% at 74% -12%,var(--stars-glow),transparent 60%)}
.stars-bg{z-index:-1;pointer-events:none;position:absolute;top:0;right:0;bottom:0;left:0;overflow:hidden}
.stars,.stars:after{width:var(--stars-size);height:var(--stars-size);box-shadow:var(--stars-field);background:0 0;border-radius:50%;position:absolute;left:0}
.stars{color:var(--stars-tint);opacity:var(--stars-opacity);animation:stars-drift var(--stars-speed) linear infinite;top:0}
.stars:after{content:"";top:var(--stars-band)}
.stars--far{--stars-size:var(--stars-far-size);--stars-field:var(--stars-far-field);--stars-tint:var(--stars-far-tint);--stars-opacity:var(--stars-far-opacity);--stars-speed:var(--stars-far-speed)}
.stars--mid{--stars-size:var(--stars-mid-size);--stars-field:var(--stars-mid-field);--stars-tint:var(--stars-mid-tint);--stars-opacity:var(--stars-mid-opacity);--stars-speed:var(--stars-mid-speed)}
.stars--near{--stars-size:var(--stars-near-size);--stars-field:var(--stars-near-field);--stars-tint:var(--stars-near-tint);--stars-opacity:var(--stars-near-opacity);--stars-speed:var(--stars-near-speed)}
.stars--spark{--stars-size:var(--stars-spark-size);--stars-field:var(--stars-spark-field);--stars-tint:var(--stars-spark-tint);--stars-opacity:var(--stars-spark-opacity);--stars-speed:var(--stars-spark-speed)}
.stars--giant{--stars-size:var(--stars-giant-size);--stars-field:var(--stars-giant-field);--stars-tint:var(--stars-giant-tint);--stars-opacity:var(--stars-giant-opacity);--stars-speed:var(--stars-giant-speed)}
@keyframes stars-drift { from { transform: translateY(0); } to { transform: translateY(calc(var(--stars-band) * -1)); } }
@media (prefers-reduced-motion: reduce) { .stars { animation: none; } }
</style>
