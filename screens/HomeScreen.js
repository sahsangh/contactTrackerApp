import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, Button, SectionList } from 'react-native';
import { Calendar } from 'react-native-calendars';
import axios from 'axios';
import { useNavigation, useRoute } from '@react-navigation/native';
import { isBefore, parseISO } from 'date-fns';

const API_URL = 'http://10.0.0.153:3000'; // Adjust based on your server setup

const HomeScreen = () => {
  const [contacts, setContacts] = useState([]);
  const [markedDates, setMarkedDates] = useState({});
  const navigation = useNavigation();
  const route = useRoute();

  useEffect(() => {
    fetchContacts();
  }, []);

  useEffect(() => {
    if (route.params?.newContact) {
      fetchContacts();
      route.params.newContact = null; // Reset the newContact parameter after fetching
    }
  }, [route.params?.newContact]);

  const fetchContacts = async () => {
    try {
      const response = await axios.get(`${API_URL}/contacts`);
      const updatedContacts = checkAndUpdateStatus(response.data);
      setContacts(updatedContacts);
      updateMarkedDates(updatedContacts);
    } catch (error) {
      console.error('Error fetching contacts:', error);
    }
  };

  const checkAndUpdateStatus = (contacts) => {
    const today = new Date();
    return contacts.map(contact => {
      const expiryDate = parseISO(contact.expiryDate);
      if (isBefore(expiryDate, today) && contact.status === 'active') {
        updateContactStatus(contact._id, 'overdue');
        return { ...contact, status: 'overdue' };
      }
      return contact;
    });
  };

  const updateMarkedDates = (contacts) => {
    const dates = {};
    contacts.forEach(contact => {
      dates[contact.expiryDate] = {
        marked: true,
        dotColor: getTypeColor(contact.type),
      };
    });
    setMarkedDates(dates);
  };

  const handleDispose = (id) => {
    updateContactStatus(id, 'expired');
  };

  const handleUndo = (id) => {
    updateContactStatus(id, 'active');
  };

  const updateContactStatus = async (id, status) => {
    try {
      const contact = contacts.find(contact => contact._id === id);
      if (contact) {
        await axios.put(`${API_URL}/contacts/${id}`, { ...contact, status });
        fetchContacts(); // Fetch contacts after updating status
      }
    } catch (error) {
      console.error('Error updating contact status:', error);
    }
  };

  const handleEdit = (contact) => {
    navigation.navigate('AddContact', { contactToEdit: contact });
  };

  const deleteContact = async (id) => {
    try {
      await axios.delete(`${API_URL}/contacts/${id}`);
      fetchContacts(); // Fetch contacts after deleting
    } catch (error) {
      console.error('Error deleting contact:', error);
    }
  };

  const renderContact = ({ item }) => (
    <View style={styles.contactItem}>
      <View style={styles.textContainer}>
        <View style={[styles.typeCircle, { backgroundColor: getTypeColor(item.type) }]} />
        <Text>{item.name} - {item.type} (Expires: {item.expiryDate})</Text>
      </View>
      <View style={styles.buttonContainer}>
        {item.status === 'expired' ? (
          <>
            <Button title="Undo" onPress={() => handleUndo(item._id)} />
            <Button title="Delete" onPress={() => deleteContact(item._id)} />
          </>
        ) : (
          <>
            <Button title="Dispose" onPress={() => handleDispose(item._id)} />
            <Button title="Edit" onPress={() => handleEdit(item)} />
          </>
        )}
      </View>
    </View>
  );

  const sections = [
    {
      title: 'Active Contacts',
      data: contacts.filter(contact => contact.status === 'active')
    },
    {
      title: 'Overdue Contacts',
      data: contacts.filter(contact => contact.status === 'overdue')
    },
    {
      title: 'Recently Expired Contacts',
      data: contacts.filter(contact => contact.status === 'expired')
    }
  ];

  return (
    <View style={styles.container}>
      <SectionList
        ListHeaderComponent={
          <>
            <View style={styles.header}>
              <Button title="Add New Contact" onPress={() => navigation.navigate('AddContact')} />
            </View>
            <View style={styles.calendarContainer}>
              <Calendar markedDates={markedDates} />
            </View>
          </>
        }
        sections={sections}
        keyExtractor={(item) => item._id}
        renderItem={renderContact}
        renderSectionHeader={({ section: { title } }) => (
          <Text style={styles.sectionTitle}>{title}</Text>
        )}
        ListEmptyComponent={<Text>No contacts found</Text>}
        contentContainerStyle={styles.sectionListContent}
      />
    </View>
  );
};

const getTypeColor = (type) => {
  switch (type) {
    case 'Daily':
      return '#00FFFF';
    case 'Weekly':
      return '#1ac983';
    case 'Bi-Weekly':
      return '#0e2c4d';
    case 'Monthly':
      return '#7d2e85';
    default:
      return '#000000';
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    padding: 16,
    backgroundColor: '#fff',
  },
  calendarContainer: {
    marginVertical: 10,
  },
  sectionListContent: {
    paddingHorizontal: 16,
  },
  sectionTitle: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: 'bold',
  },
  contactItem: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  textContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  typeCircle: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 10,
  },
});

export default HomeScreen;
