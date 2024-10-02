import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  ImageBackground,
  Alert,
  ScrollView,
  ActivityIndicator,
  Button,
  Pressable,
} from 'react-native';
import React, {useEffect, useState} from 'react';
import {useLocation} from '../hooks/useLocation';
import {openCamera, openPicker} from 'react-native-image-crop-picker';
import RNFS from 'react-native-fs';
import {Dropdown} from 'react-native-element-dropdown';
import AsyncStorage from '@react-native-async-storage/async-storage';
import moment from 'moment';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import DateTimePicker from 'react-native-modal-datetime-picker';

const depots = [
  {id: 18, nom: 'TIT MELLIL'},
  {id: 17, nom: 'ZENATA'},
  {id: 15, nom: 'TACHFINE'},
  {id: 21, nom: 'AGENCE AGADIR'},
];

const AddReception = ({route, navigation}) => {
  const [cadre, setCadre] = useState('');
  const [matricule, setMatricule] = useState('');
  const [observation, setObservation] = useState('');
  const [images, setImages] = useState([]);
  const [location, setLocation] = useState(null);
  const [selectedDepot, setSelectedDepot] = useState(0);
  const [depots, setDepots] = useState([]);
  const [isSubmiting, setIsSubmiting] = useState(false);
  const [address, setAddress] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
  const [selectedDateTime, setSelectedDateTime] = useState(
    moment(new Date()).format('YYYY-MM-DD HH:mm:ss'),
  );

  // Show the picker
  const showDatePicker = () => {
    setDatePickerVisibility(true);
  };

  // Hide the picker
  const hideDatePicker = () => {
    setDatePickerVisibility(false);
  };

  // Handle the selected date and time
  const handleConfirm = date => {
    setSelectedDateTime(moment(date).format('YYYY-MM-DD hh:mm:ss')); // Format to string
    hideDatePicker();
  };

  const saveReception = async () => {
    if (cadre == '' || matricule == '' || selectedDepot == 0) {
      Alert.alert('Erreur', 'Veuillez remplir les champs obligatoires');
      return;
    }

    if (images.length === 0) {
      Alert.alert('Erreur', 'Veuillez ajouter une image');
      return;
    }
    if (location === null) {
      Alert.alert('Erreur', 'Veuillez activer la localisation');
      navigation.replace('AddReception');
      return;
    }

    const reception = {
      matricule,
      cadre,
      observation,
      latitude: location.latitude,
      longitude: location.longitude,
      address,
      depot_id: selectedDepot,
      dateSortiePort: selectedDateTime,
    };

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
      ...reception,
      images: imagesData,
    };

    try {
      setIsSubmiting(true);
      const token = await AsyncStorage.getItem('userToken');
      const response = await fetch(
        'https://tbg.comarbois.ma/controle_reception/api/receptions/add',
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

      if (response.status != 200) {
        Alert.alert(
          'Erreur',
          "Une erreur est survenue lors de l'enregistrement",
        );
        return;
      }

      Alert.alert('Succès', 'Réception enregistrée avec succès');
      navigation.replace('ListReceptions');
    } catch (err) {
      console.log(err);
    } finally {
      setIsSubmiting(false);
    }
  };

  const handleOpenCamera = () => {
    console.log('open camera');
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

  const fetchAddress = async (lon, lat) => {
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

  useEffect(() => {
    const fetchdata = async () => {
      setIsLoading(true);
      await fetchLocation();
      await fetchAddress(location?.longitude, location?.latitude);
      const user = JSON.parse(await AsyncStorage.getItem('user'));
      const depots = user.depots;
      console.log(depots);
      setDepots(depots);
      setSelectedDepot(depots[0].id);
      setIsLoading(false);
    };
    fetchdata();
  }, []);

  return (
    <View style={styles.container}>
      {isLoading ? (
        <ActivityIndicator size="large" color="#0000ff" />
      ) : (
        <>
          <ScrollView>
            <Text style={styles.label}>
              Date :{' '}
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: 'bold',
                  textAlign: 'start',
                }}>
                {moment().format('DD/MM/YYYY HH:mm:ss')}
              </Text>
            </Text>

            <Text style={styles.label}>
              Depot : <Text style={{color: 'red'}}>*</Text>
            </Text>
            <Dropdown
              data={depots}
              value={selectedDepot}
              labelField={'nom'}
              valueField={'id'}
              style={styles.dropdown}
              placeholder="Selectionner un depot"
              onChange={item => setSelectedDepot(item.id)}
            />

            <Text style={styles.label}>
              Matricule <Text style={{color: 'red'}}>*</Text>
            </Text>
            <TextInput
              style={styles.TextInput}
              onChangeText={text => setMatricule(text)}
            />
            <Text style={styles.label}>
              Cadre <Text style={{color: 'red'}}>*</Text>
            </Text>
            <TextInput
              style={styles.TextInput}
              onChangeText={text => setCadre(text)}
            />

            <Text style={styles.label}>Date sortie port <Text style={{color: 'red'}}>*</Text></Text>
            <Pressable onPress={showDatePicker}>
              <Text style={styles.TextInput}>
                {selectedDateTime || 'Selectionner une date'}
              </Text>
            </Pressable>

            <DateTimePicker
              isVisible={isDatePickerVisible}
              mode="datetime" // This is key to pick both date and time
              onConfirm={handleConfirm}
              onCancel={hideDatePicker}
            />
            <Text style={styles.label}>Observation</Text>
            <TextInput
              style={[styles.TextInput, {height: 65}]}
              multiline
              onChangeText={text => setObservation(text)}
            />

            <Text style={styles.label}>
              Images <Text style={{color: 'red'}}>*</Text>
            </Text>
            <View style={{flexDirection: 'row', marginTop: 20}}>
              <TouchableOpacity style={styles.btn} onPress={handleOpenCamera}>
                <Image
                  source={require('../assets/camera.png')}
                  style={styles.image}
                />
              </TouchableOpacity>
              <TouchableOpacity style={styles.btn} onPress={handleOpenGallery}>
                <Image
                  source={require('../assets/gallery.png')}
                  style={styles.image}
                />
              </TouchableOpacity>
            </View>
            <View
              style={{flexDirection: 'row', flexWrap: 'wrap', marginTop: 20}}>
              {images.map((image, index) => (
                <View
                  key={index}
                  style={{
                    width: 100,
                    height: 100,
                    marginRight: 10,
                    marginBottom: 10,
                    position: 'relative',
                  }}>
                  <ImageBackground
                    source={{uri: image.path}}
                    style={{
                      width: '100%',
                      height: '100%',
                      borderRadius: 5,
                      overflow: 'hidden',
                    }}
                  />
                  <TouchableOpacity
                    style={{
                      position: 'absolute',
                      top: 0,
                      right: 0,
                      padding: 5,
                      borderRadius: 5,
                    }}
                    onPress={() => {
                      setImages(images.filter(img => img.path !== image.path));
                    }}>
                    <Image
                      source={require('../assets/close.png')}
                      style={{
                        width: 20,
                        height: 20,
                        resizeMode: 'contain',
                      }}
                    />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </ScrollView>

          <TouchableOpacity
            style={[
              styles.button,
              {backgroundColor: isSubmiting ? '#af0007' : '#d32f2f'},
            ]}
            onPress={saveReception}
            disabled={isSubmiting}>
            <Text style={styles.buttonText}>
              {isSubmiting ? 'Enregistrement...' : 'Enregistrer'}
            </Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
    backgroundColor: '#fefefe',
    height: '100%',
    paddingBottom: 100,
  },
  label: {
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'start',
    marginTop: 10,
  },
  dropdown: {
    height: 45,
    backgroundColor: 'transparent',
    borderColor: 'gray',
    borderWidth: 0.5,
    borderRadius: 5,
    marginTop: 10,
    padding: 5,
    color: 'black',
  },

  button: {
    padding: 10,
    borderRadius: 5,
    width: '80%',
    alignSelf: 'center',
    position: 'absolute',
    bottom: 40,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  btnsContainer: {
    flexDirection: 'row',
    marginTop: 20,
  },
  TextInput: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    padding: 10,
    marginTop: 10,
    width: '100%',
    borderRadius: 5,
  },

  btn: {
    backgroundColor: 'transparent',
    padding: 10,
    borderRadius: 5,
    marginRight: 10,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnText: {
    color: '#020202',
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  image: {
    width: 50,
    height: 50,
    marginRight: 10,
    marginBottom: 10,
  },
});
export default AddReception;
