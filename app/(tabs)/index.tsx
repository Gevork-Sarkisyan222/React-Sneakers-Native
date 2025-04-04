import Header from '@/components/Header';
import ProductList from '@/components/ProductList';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

export default function Index() {
  return (
    <>
      <SafeAreaView>
        <ScrollView>
          <View>
            <Header />

            <ProductList />
          </View>
        </ScrollView>
      </SafeAreaView>

      <View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 999999,
          elevation: 999999,
        }}>
        <Toast />
      </View>
    </>
  );
}
