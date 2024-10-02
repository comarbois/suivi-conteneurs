import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  BackHandler,
  Alert,
  ActivityIndicator,
  Modal,
  ImageBackground,
} from 'react-native';
import React, {useEffect, useState} from 'react';
import {useLocation} from '../hooks/useLocation';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {FlatList, GestureHandlerRootView} from 'react-native-gesture-handler';
import {openCamera, openPicker} from 'react-native-image-crop-picker';
import RNFS from 'react-native-fs';
import moment from 'moment';

const app_url = 'https://tbg.comarbois.ma/data/controle_reception/';

const ListReceptions = ({route, navigation}) => {
  const [location, setLocation] = useState(null);
  const [receptions, setReceptions] = useState([]);
  const [isLoading, setIsloading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [images, setImages] = useState([]);
  const [idReception, setIdReception] = useState(0);
  const [modalImagesVisible, setModalImagesVisible] = useState(false);
  const [selectedImages, setSelectedImages] = useState([]);
  const [isSubmiting, setIsSubmiting] = useState(false);
  const [address, setAddress] = useState('');

  useEffect(() => {
    const handleBackPress = () => {
      if (navigation.isFocused()) {
        Alert.alert('Quitter', "Voulez vous quitter l'application ?", [
          {
            text: 'Non',
            onPress: () => null,
            style: 'cancel',
          },
          {
            text: 'Oui',
            onPress: () => {
              AsyncStorage.clear()
                .then(() => {
                  BackHandler.exitApp();
                })
                .catch(error => {
                  console.error('Error clearing AsyncStorage:', error);
                });
            },
          },
        ]);
        return true;
      }
      return false;
    };

    BackHandler.addEventListener('hardwareBackPress', handleBackPress);

    return () => {
      BackHandler.removeEventListener('hardwareBackPress', handleBackPress);
    };
  }, [navigation]);

  const closeModal = () => {
    setImages([]);
    setModalVisible(false);
  };

  const handleOpenCamera = () => {
    openCamera({
      width: 300,
      height: 400,
      cropping: true,
    })
      .then(image => {
        setImages([...images, image]);
      })
      .catch(err => {
        console.log(err);
      });
  };

  const handleOpenGallery = () => {
    openPicker({
      width: 1000,
      height: 700,
      cropping: true,
    })
      .then(image => {
        setImages([...images, image]);
      })
      .catch(err => {
        console.log(err);
      });
  };

  const fetchLocation = async () => {
    try {
      const loc = await useLocation();
      setLocation(loc);
    } catch (err) {
      console.log(err);
    }
  };

  


  const fetchAddress = async (lon,lat) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=33.5951729&lon=-7.497519&zoom=18&addressdetails=1&accept-language=fr`,
      );
      const {display_name} = await response.json();
      setAddress(display_name);
      
    } catch (error) {
      console.error('Error fetching address:', error);
    }
  };

    


  const fetchReceptions = async () => {
    try {
      console.log('fetching receptions');
      const token = await AsyncStorage.getItem('userToken');
      const response = await fetch(
        'https://tbg.comarbois.ma/controle_reception/api/receptions/list',
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      const data = await response.json();
      setReceptions(data);
    } catch (error) {
      console.error('Error fetching receptions:', error);
    }
  };

  function handleLogout() {
    Alert.alert('Deconnexion', "Voulez vous se deconnecter ?", [
      {
        text: 'Non',
        onPress: () => null,
        style: 'cancel',
      },
      {
        text: 'Oui',
        onPress: async () => {
          await AsyncStorage.clear();
          navigation.replace('Login');
        },
      },
    ]);
  }

  const handleUpdate = async id => {
    if (images.length === 0) {
      Alert.alert('Erreur', 'Veuillez ajouter au moins une image');
      return;
    }
    if (location.latitude === null || location.longitude === null) {
      Alert.alert('Erreur', 'Veuillez activer la localisation');
      navigation.replace('ListReceptions');
      return;
    }


    try {
      setIsSubmiting(true);
      const token = await AsyncStorage.getItem('userToken');
      const imagesData = [];
      for (const image of images) {
        const path = image.path;
        const imgData = await RNFS.readFile(
          path.replace('file://', ''),
          'base64',
        );
        imagesData.push({imgData});
      }

      const formData = {
        images: imagesData,
        id: idReception,
        latitude: location.latitude,
        longitude: location.longitude,
        address: address,
      };

      console.log(address);
      const response = await fetch(
        'https://tbg.comarbois.ma/controle_reception/api/receptions/update',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(formData),
        },
      );
      const data = await response.json();
      console.log(data);
      if (!response.ok) {
        Alert.alert('Erreur', 'Une erreur est survenue');
        return;
      }
      Alert.alert('Succès', 'Reception mise à jour avec succès');
      setIsloading(true);
      await fetchReceptions();
      setIsloading(false);
      setImages([]);
      closeModal();
    } catch (error) {
      Alert.alert('Erreur', 'Une erreur est survenue');
      console.error('Error updating reception:', error);
    }finally {
      setIsSubmiting(false);
    }

  };

  const renderItem = ({item}) => {
    return (
      <View style={styles.card}>
        <Text style={styles.cardTitle}>
          {item.cadre} ({' '}
          <Text
            style={{
              color: item.status == 'En cours' ? 'orange' : 'green',
              fontSize: 12,
            }}>
            {item.status == 'En cours' ? 'Entré' : 'Sortie'}
          </Text>{' '}
          )
        </Text>
        <Text>Entré : {moment(item.dateCreate ).format( 'DD/MM/YYYY HH:mm:ss')}</Text>
        {item.dateModif !== '0000-00-00 00:00:00' && (
          <Text>Sortie : {moment(item.dateModif).format( 'DD/MM/YYYY HH:mm:ss')}</Text>
        )}
        <Text>
         {item.matricul}
        </Text>
        <Text>{item.depot}</Text>

        <View style={styles.cardBtns}>
          {item.status !== 'Terminer' && (
            <TouchableOpacity
              onPress={() => {
                setModalVisible(true);
                setIdReception(item.id);
              }}>
              <Image
                source={require('../assets/sync.png')}
                style={{width: 32, height: 32}}
              />
            </TouchableOpacity>
          )}

          <TouchableOpacity
            onPress={() => {
              setSelectedImages(item.images);
              console.log(`${app_url}${item.images.entre[0].fichier}`);
              setModalImagesVisible(true);
            }}>
            <Image
              source={require('../assets/gallery.png')}
              style={{width: 32, height: 32}}
            />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  useEffect(() => {
    const fetchData = async () => {
      setIsloading(true);
      await fetchLocation();
     
      await fetchAddress(location?.latitude, location?.longitude);
      await fetchReceptions();
      setIsloading(false);
    };

    fetchData();
  }, []);

  return (
    <GestureHandlerRootView >
      <View style={[styles.flex, {backgroundColor:'white'}]}>
            <View style={{flexDirection:'row', alignItems:'center'}}>
              <Image source={require('../assets/container.png')} style={{width: 50, height: 50}} />
              <Text style={{fontWeight:'bold', marginLeft:10}}>Suivi Conteneurs</Text>
            </View>

            <View>
              <TouchableOpacity onPress={handleLogout}>
                <Image source={require('../assets/logout.png')} style={{width: 40, height: 40}} />
              </TouchableOpacity>

            </View>

      </View>
      {isLoading ? (
        <ActivityIndicator size="large" color="#0000ff" />
      ) : (
        <View style={styles.container}>
          
          <View style={styles.flex}>
            <Text> {receptions.length} Enregistrements</Text>
            <TouchableOpacity
              onPress={() => {
                navigation.navigate('AddReception');
              }}
              style={styles.btnAjouter}>
              <Image
                source={require('../assets/add.png')}
                style={styles.btnIcon}
              />
              <Text style={styles.btnText}>Ajouter</Text>
            </TouchableOpacity>
          </View>

          <FlatList
            data={receptions}
            renderItem={renderItem}
            keyExtractor={item => item.id}
          />

          <Modal
            animationType="slide"
            transparent={true}
            visible={modalVisible}
            onRequestClose={closeModal}>
            <View style={styles.modalContainer}>
              <View style={styles.modalContent}>
                <TouchableOpacity onPress={closeModal} style={styles.btnClose}>
                  <Image
                    source={require('../assets/close.png')}
                    style={styles.closeBtn}
                  />
                </TouchableOpacity>

                <Text style={{fontSize: 16, fontWeight: 'bold'}}>
                  Déclarer la sortie
                </Text>

                <View style={{flexDirection: 'row', marginTop: 20}}>
                  <TouchableOpacity
                    style={styles.btn}
                    onPress={handleOpenCamera}>
                    <Image
                      source={require('../assets/camera.png')}
                      style={styles.image}
                    />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.btn}
                    onPress={handleOpenGallery}>
                    <Image
                      source={require('../assets/gallery.png')}
                      style={styles.image}
                    />
                  </TouchableOpacity>
                </View>

                <View
                  style={{
                    flexDirection: 'row',
                    flexWrap: 'wrap',
                    marginTop: 20,
                  }}>
                  {images.map((image, index) => (
                    <ImageBackground
                      key={index}
                      source={{uri: image.path}}
                      style={{
                        width: 100,
                        height: 100,
                        marginRight: 10,
                        marginBottom: 10,
                      }}
                    />
                  ))}
                </View>

                <TouchableOpacity style={[styles.button, {backgroundColor: isSubmiting ? '#af0007' : '#d32f2f' }]} onPress={handleUpdate} disabled={isSubmiting}>
                  <Text style={styles.buttonText}>{ isSubmiting ? 'Enregistrement ...' : 'Enregistrer' }</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>

          <Modal
            animationType="slide"
            transparent={true}
            visible={modalImagesVisible}
            onRequestClose={() => setModalImagesVisible(false)}>
            <View style={styles.modalContainer}>
              <View style={styles.modalContent}>
                <TouchableOpacity
                  onPress={() => setModalImagesVisible(false)}
                  style={styles.btnClose}>
                  <Image
                    source={require('../assets/close.png')}
                    style={styles.closeBtn}
                  />
                </TouchableOpacity>
                {selectedImages?.entre?.length > 0 && (
                  <>
                    <Text style={{fontSize: 16, fontWeight: 'bold'}}>
                      Images d'entrée
                    </Text>
                    <FlatList
                      data={selectedImages.entre}
                      renderItem={({item}) => (
                        <Image
                          source={{uri: `${app_url}${item.fichier}`}}
                          style={styles.modalImage}
                        />
                      )}
                      keyExtractor={item => item.id}
                    />
                  </>
                  
               )}

                {selectedImages?.sortie?.length > 0 && (
                  <>
                    <Text style={{fontSize: 16, fontWeight: 'bold'}}>
                      Images de sortie
                    </Text>
                    <FlatList
                      data={selectedImages.sortie}
                      horizontal
                      renderItem={({item}) => (
                        <Image
                          source={{uri: `${app_url}${item.fichier}`}}
                          style={styles.modalImage}
                        />
                      )}
                      keyExtractor={item => item.id}
                    />
                  </>
                )}
              </View>
            </View>
          </Modal>
        </View>
      )}
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    backgroundColor: '#f0f0f0',
    width: '100%',
    padding: 10,
    paddingBottom: 100,
  },
  btnAjouter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#d32f2f',
    padding: 5,
    borderRadius: 5,
    width: 100,
  },
  btnText: {
    color: '#fff',
    fontSize: 14,
  },
  btnIcon: {
    width: 20,
    height: 20,
    marginRight: 5,
  },
  cardBtns: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 10,
    marginTop: 10,
  },
  flex: {
    padding: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 5,
    padding: 15,
    marginVertical: 10,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    width: '90%',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
    position: 'relative',
  },
  modalImage: {
    maxWidthwidth: 100,
    height: 200,
    aspectRatio: 16 / 9,
    marginBottom: 10,
  },
  btnClose: {
    position: 'absolute',
    top: -10,
    right: -10,
    zIndex: 1,
  },
  closeBtn: {
    width: 30,
    height: 30,
  },
  image: {
    width: 50,
    height: 50,
    marginRight: 10,
    marginBottom: 10,
  },
  button: {
    backgroundColor: '#d32f2f',
    padding: 10,
    borderRadius: 5,
    width: '80%',
    alignSelf: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default ListReceptions;
