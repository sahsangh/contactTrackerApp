import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, Button, Platform } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation, useRoute } from '@react-navigation/native';
import { format, addDays, parseISO } from 'date-fns';
import axios from 'axios';

const API_URL = 'http://10.0.0.153:3000'; // Adjust based on your server setup

const calculateExpiryDate = (startDate, type) => {
  let expiryDate;
  switch (type) {
    case 'Daily':
      expiryDate = addDays(new Date(startDate), 2);
      break;
    case 'Weekly':
      expiryDate = addDays(new Date(startDate), 8);
      break;
    case 'Bi-Weekly':
      expiryDate = addDays(new Date(startDate), 15);
      break;
    case 'Monthly':
      expiryDate = addDays(new Date(startDate), 31); // Use 30 days for monthly
      break;
    default:
      expiryDate = new Date(startDate);
  }
  return format(expiryDate, 'yyyy-MM-dd');
};

const AddContactScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const contactToEdit = route.params?.contactToEdit || null;
  const [id, setId] = useState(contactToEdit ? contactToEdit._id : null);
  const [type, setType] = useState(contactToEdit ? contactToEdit.type : 'Monthly');
  const [startDate, setStartDate] = useState(contactToEdit ? parseISO(contactToEdit.startDate) : new Date());
  const [expiryDate, setExpiryDate] = useState(contactToEdit ? parseISO(contactToEdit.expiryDate) : calculateExpiryDate(startDate, type));
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [name, setName] = useState(contactToEdit ? contactToEdit.name : '');

  useEffect(() => {
    if (!contactToEdit) {
      fetchAndSetContactName();
    }
  }, []);

  useEffect(() => {
    setExpiryDate(calculateExpiryDate(startDate, type));
  }, [startDate, type]);

  const fetchAndSetContactName = async () => {
    try {
      const response = await axios.get(`${API_URL}/contacts`);
      const contacts = response.data;
      const maxNumber = contacts.reduce((max, contact) => {
        const match = contact.name.match(/Contact (\d+)/);
        return match ? Math.max(max, parseInt(match[1], 10)) : max;
      }, 0);
      setName(`Contact ${maxNumber + 1}`);
    } catch (error) {
      console.error('Error fetching contacts:', error);
    }
  };

  const handleSaveContact = async () => {
    const newContact = {
      name: name,
      status: 'active',
      type,
      startDate: format(startDate, 'yyyy-MM-dd'),
      expiryDate: format(expiryDate, 'yyyy-MM-dd')
    };

    try {
      if (id) {
        newContact._id = id;
        await axios.put(`${API_URL}/contacts/${id}`, newContact);
      } else {
        const response = await axios.post(`${API_URL}/contacts`, newContact);
        newContact._id = response.data._id;
      }

      navigation.navigate('Home', { newContact });
    } catch (error) {
      console.error('Error saving contact:', error);
    }
  };

  return (
    <View style={styles.addContactContainer}>
      <Text style={styles.sectionTitle}>Add/Edit Contact</Text>
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Name:</Text>
        <Text style={styles.value}>{name}</Text>
      </View>
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Start Date:</Text>
        <Button title={format(startDate, 'yyyy-MM-dd')} onPress={() => setShowDatePicker(true)} />
        {showDatePicker && (
          <DateTimePicker
            value={startDate}
            mode="date"
            display="default"
            onChange={(event, selectedDate) => {
              setShowDatePicker(Platform.OS === 'ios');
              if (selectedDate) {
                setStartDate(selectedDate);
                setExpiryDate(calculateExpiryDate(selectedDate, type));
              }
            }}
          />
        )}
      </View>
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Type:</Text>
        <Picker
          selectedValue={type}
          style={styles.picker}
          onValueChange={(itemValue) => setType(itemValue)}
        >
          <Picker.Item label="Monthly" value="Monthly" />
          <Picker.Item label="Bi-Weekly" value="Bi-Weekly" />
          <Picker.Item label="Weekly" value="Weekly" />
          <Picker.Item label="Daily" value="Daily" />
        </Picker>
      </View>
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Expiry Date:</Text>
        <Text style={styles.value}>{format(expiryDate, 'yyyy-MM-dd')}</Text>
      </View>
      <Button title="Save Contact" onPress={handleSaveContact} />
      <Button title="Go Back" onPress={() => navigation.goBack()} />
    </View>
  );
};

const styles = StyleSheet.create({
  addContactContainer: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  inputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    width: 100,
  },
  value: {
    fontSize: 16,
  },
  picker: {
    height: 50,
    width: 150,
    marginBottom:150,
  },
});

export default AddContactScreen;