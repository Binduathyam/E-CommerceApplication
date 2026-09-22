import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { API_BASE_URL } from '../../config/api';

type Address = {
  id: number;
  user_id?: number;
  full_name: string;
  phone: string;
  address_line: string;
  city: string;
  state: string;
  pincode: string;
};

type FormData = {
  full_name: string;
  phone: string;
  address_line: string;
  city: string;
  state: string;
  pincode: string;
};

const emptyForm: FormData = {
  full_name: '',
  phone: '',
  address_line: '',
  city: '',
  state: '',
  pincode: '',
};

export default function AddressScreen() {
  const router = useRouter();

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);

  const [modalVisible, setModalVisible] = useState(false);
  const [saving, setSaving] = useState(false);

  const [editingAddress, setEditingAddress] =
    useState<Address | null>(null);

  const [form, setForm] =
    useState<FormData>(emptyForm);

  // =====================================================
  // GET LOGGED-IN USER
  // =====================================================

  const getUserId = async (): Promise<number | null> => {
    try {
      const savedUser =
        await AsyncStorage.getItem('loggedInUser');

      if (!savedUser) {
        return null;
      }

      const user = JSON.parse(savedUser);

      if (!user?.id) {
        return null;
      }

      return Number(user.id);
    } catch (error) {
      console.error('Get user error:', error);
      return null;
    }
  };

  // =====================================================
  // CREATE UNIQUE ADDRESS KEY
  // =====================================================

  const createAddressKey = (
    address: Partial<Address>
  ) => {
    return [
      address.full_name,
      address.phone,
      address.address_line,
      address.city,
      address.state,
      address.pincode,
    ]
      .map((value) =>
        String(value || '')
          .trim()
          .toLowerCase()
      )
      .join('|');
  };

  // =====================================================
  // REMOVE DUPLICATE ADDRESSES
  // =====================================================

  const removeDuplicateAddresses = (
    addressList: Address[]
  ): Address[] => {
    const uniqueAddresses: Address[] = [];
    const seenAddresses = new Set<string>();

    for (const address of addressList) {
      const uniqueKey =
        createAddressKey(address);

      if (!seenAddresses.has(uniqueKey)) {
        seenAddresses.add(uniqueKey);
        uniqueAddresses.push(address);
      }
    }

    return uniqueAddresses;
  };

  // =====================================================
  // LOAD ADDRESSES
  // =====================================================

  const loadAddresses = async () => {
    try {
      setLoading(true);

      const userId = await getUserId();

      if (!userId) {
        setAddresses([]);
        return;
      }

      const response = await fetch(
        `${API_BASE_URL}/api/addresses/${userId}`
      );

      const data = await response.json();

      console.log(
        'ADDRESSES API RESPONSE:',
        JSON.stringify(data, null, 2)
      );

      if (!response.ok) {
        throw new Error(
          data?.message ||
            'Failed to fetch addresses'
        );
      }

      const addressList =
        Array.isArray(data?.addresses)
          ? data.addresses
          : [];

      const uniqueAddresses =
        removeDuplicateAddresses(
          addressList
        );

      setAddresses(uniqueAddresses);
    } catch (error) {
      console.error(
        'Load addresses error:',
        error
      );

      Alert.alert(
        'Error',
        'Unable to load addresses.'
      );
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // LOAD ON SCREEN OPEN
  // =====================================================

  useEffect(() => {
    loadAddresses();
  }, []);

  // =====================================================
  // OPEN ADD FORM
  // =====================================================

  const openAddForm = () => {
    setEditingAddress(null);

    setForm({
      ...emptyForm,
    });

    setModalVisible(true);
  };

  // =====================================================
  // OPEN EDIT FORM
  // =====================================================

  const openEditForm = (
    address: Address
  ) => {
    setEditingAddress(address);

    setForm({
      full_name:
        address.full_name || '',

      phone:
        address.phone || '',

      address_line:
        address.address_line || '',

      city:
        address.city || '',

      state:
        address.state || '',

      pincode:
        address.pincode || '',
    });

    setModalVisible(true);
  };

  // =====================================================
  // CLOSE FORM
  // =====================================================

  const closeForm = () => {
    if (saving) {
      return;
    }

    setModalVisible(false);

    setEditingAddress(null);

    setForm({
      ...emptyForm,
    });
  };

  // =====================================================
  // UPDATE FORM
  // =====================================================

  const updateField = (
    field: keyof FormData,
    value: string
  ) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  // =====================================================
  // VALIDATE FORM
  // =====================================================

  const validateForm = () => {
    if (
      !form.full_name.trim() ||
      !form.phone.trim() ||
      !form.address_line.trim() ||
      !form.city.trim() ||
      !form.state.trim() ||
      !form.pincode.trim()
    ) {
      Alert.alert(
        'Missing Details',
        'Please fill all address fields.'
      );

      return false;
    }

    if (
      !/^\d{10}$/.test(
        form.phone.trim()
      )
    ) {
      Alert.alert(
        'Invalid Phone',
        'Please enter a valid 10-digit phone number.'
      );

      return false;
    }

    if (
      !/^\d{6}$/.test(
        form.pincode.trim()
      )
    ) {
      Alert.alert(
        'Invalid Pincode',
        'Please enter a valid 6-digit pincode.'
      );

      return false;
    }

    return true;
  };

  // =====================================================
  // CHECK DUPLICATE ADDRESS
  // =====================================================

  const checkDuplicateAddress = (
    currentForm: FormData
  ) => {
    const newAddressKey =
      createAddressKey({
        full_name:
          currentForm.full_name,

        phone:
          currentForm.phone,

        address_line:
          currentForm.address_line,

        city:
          currentForm.city,

        state:
          currentForm.state,

        pincode:
          currentForm.pincode,
      });

    return addresses.some(
      (address) => {
        if (
          editingAddress &&
          Number(address.id) ===
            Number(editingAddress.id)
        ) {
          return false;
        }

        const existingAddressKey =
          createAddressKey(address);

        return (
          existingAddressKey ===
          newAddressKey
        );
      }
    );
  };

  // =====================================================
  // SAVE ADDRESS
  // =====================================================

  const saveAddress = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setSaving(true);

      const userId = await getUserId();

      if (!userId) {
        Alert.alert(
          'Login Required',
          'Please login again to manage your addresses.'
        );

        return;
      }

      if (
        checkDuplicateAddress(form)
      ) {
        Alert.alert(
          'Address Already Saved',
          'This address is already saved. Please use the existing address or enter a different one.'
        );

        return;
      }

      const payload = {
        user_id: userId,
        full_name:
          form.full_name.trim(),
        phone:
          form.phone.trim(),
        address_line:
          form.address_line.trim(),
        city:
          form.city.trim(),
        state:
          form.state.trim(),
        pincode:
          form.pincode.trim(),
      };

      let response: Response;

      // =================================================
      // UPDATE
      // =================================================

      if (editingAddress) {
        response = await fetch(
          `${API_BASE_URL}/api/addresses/${editingAddress.id}`,
          {
            method: 'PUT',

            headers: {
              'Content-Type':
                'application/json',
            },

            body:
              JSON.stringify(
                payload
              ),
          }
        );
      }

      // =================================================
      // ADD
      // =================================================

      else {
        response = await fetch(
          `${API_BASE_URL}/api/addresses`,
          {
            method: 'POST',

            headers: {
              'Content-Type':
                'application/json',
            },

            body:
              JSON.stringify(
                payload
              ),
          }
        );
      }

      const data =
        await response.json();

      if (
        !response.ok ||
        !data?.success
      ) {
        throw new Error(
          data?.message ||
            'Failed to save address'
        );
      }

      setModalVisible(false);

      setEditingAddress(null);

      setForm({
        ...emptyForm,
      });

      await loadAddresses();

      Alert.alert(
        'Success',
        editingAddress
          ? 'Address updated successfully.'
          : 'Address added successfully.'
      );
    } catch (error) {
      console.error(
        'Save address error:',
        error
      );

      Alert.alert(
        'Error',
        error instanceof Error
          ? error.message
          : 'Unable to save address.'
      );
    } finally {
      setSaving(false);
    }
  };

  // =====================================================
  // DELETE ADDRESS
  // =====================================================

  const deleteAddress = (
    address: Address
  ) => {
    Alert.alert(
      'Delete Address',
      'Are you sure you want to delete this address?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },

        {
          text: 'Delete',
          style: 'destructive',

          onPress: async () => {
            try {
              const userId =
                await getUserId();

              if (!userId) {
                return;
              }

              const response =
                await fetch(
                  `${API_BASE_URL}/api/addresses/${address.id}`,
                  {
                    method: 'DELETE',

                    headers: {
                      'Content-Type':
                        'application/json',
                    },

                    body:
                      JSON.stringify({
                        user_id:
                          userId,
                      }),
                  }
                );

              const data =
                await response.json();

              if (
                !response.ok ||
                !data?.success
              ) {
                throw new Error(
                  data?.message ||
                    'Failed to delete address'
                );
              }

              await loadAddresses();

              Alert.alert(
                'Deleted',
                'Address deleted successfully.'
              );
            } catch (error) {
              console.error(
                'Delete address error:',
                error
              );

              Alert.alert(
                'Error',
                error instanceof Error
                  ? error.message
                  : 'Unable to delete address.'
              );
            }
          },
        },
      ]
    );
  };

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <View
        style={
          styles.loadingContainer
        }
      >
        <ActivityIndicator
          size="large"
          color="#7c3aed"
        />

        <Text
          style={
            styles.loadingText
          }
        >
          Loading addresses...
        </Text>
      </View>
    );
  }

  // =====================================================
  // SCREEN
  // =====================================================

  return (
    <View style={styles.container}>

      {/* HEADER */}

      <View style={styles.header}>

        <TouchableOpacity
          style={
            styles.backButton
          }
          onPress={() =>
            router.back()
          }
        >
          <Text
            style={
              styles.backText
            }
          >
            ‹
          </Text>
        </TouchableOpacity>

        <Text
          style={styles.title}
        >
          My Addresses
        </Text>

        <TouchableOpacity
          style={
            styles.addHeaderButton
          }
          onPress={openAddForm}
        >
          <Text
            style={
              styles.addHeaderText
            }
          >
            +
          </Text>
        </TouchableOpacity>

      </View>

      {/* CONTENT */}

      <ScrollView
        contentContainerStyle={
          styles.content
        }
        showsVerticalScrollIndicator={
          false
        }
        keyboardShouldPersistTaps="handled"
      >

        {/* INFO */}

        <View
          style={styles.infoBox}
        >
          <Text
            style={
              styles.infoIcon
            }
          >
            📍
          </Text>

          <View
            style={
              styles.infoContent
            }
          >
            <Text
              style={
                styles.infoTitle
              }
            >
              Saved Delivery Addresses
            </Text>

            <Text
              style={
                styles.infoText
              }
            >
              Manage your saved delivery
              addresses from here.
            </Text>
          </View>
        </View>

        {/* ADD BUTTON */}

        <TouchableOpacity
          style={
            styles.addButton
          }
          onPress={openAddForm}
          activeOpacity={0.8}
        >
          <Text
            style={
              styles.addButtonText
            }
          >
            + Add New Address
          </Text>
        </TouchableOpacity>

        {/* EMPTY */}

        {addresses.length === 0 ? (

          <View
            style={
              styles.emptyContainer
            }
          >
            <Text
              style={
                styles.emptyIcon
              }
            >
              📦
            </Text>

            <Text
              style={
                styles.emptyTitle
              }
            >
              No Saved Addresses
            </Text>

            <Text
              style={
                styles.emptyText
              }
            >
              Add your first delivery address
              to make checkout faster.
            </Text>

            <TouchableOpacity
              style={
                styles.shopButton
              }
              onPress={
                openAddForm
              }
            >
              <Text
                style={
                  styles.shopButtonText
                }
              >
                Add Address
              </Text>
            </TouchableOpacity>
          </View>

        ) : (

          <>
            <Text
              style={
                styles.countText
              }
            >
              {addresses.length}{' '}
              {addresses.length === 1
                ? 'address'
                : 'addresses'}{' '}
              saved
            </Text>

            {addresses.map(
              (address) => (

                <View
                  key={address.id}
                  style={
                    styles.addressCard
                  }
                >

                  <View
                    style={
                      styles.addressHeader
                    }
                  >

                    <View
                      style={
                        styles.locationCircle
                      }
                    >
                      <Text
                        style={
                          styles.locationIcon
                        }
                      >
                        📍
                      </Text>
                    </View>

                    <View
                      style={
                        styles.headerInfo
                      }
                    >
                      <Text
                        style={
                          styles.name
                        }
                      >
                        {address.full_name}
                      </Text>

                      <Text
                        style={
                          styles.phone
                        }
                      >
                        {address.phone}
                      </Text>
                    </View>

                  </View>

                  <Text
                    style={
                      styles.addressLine
                    }
                  >
                    {address.address_line}
                  </Text>

                  <Text
                    style={
                      styles.cityLine
                    }
                  >
                    {address.city},{' '}
                    {address.state}
                  </Text>

                  <Text
                    style={
                      styles.pincode
                    }
                  >
                    Pincode:{' '}
                    {address.pincode}
                  </Text>

                  <View
                    style={
                      styles.actionsRow
                    }
                  >

                    <TouchableOpacity
                      style={
                        styles.editButton
                      }
                      onPress={() =>
                        openEditForm(
                          address
                        )
                      }
                    >
                      <Text
                        style={
                          styles.editText
                        }
                      >
                        ✏️ Edit
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={
                        styles.deleteButton
                      }
                      onPress={() =>
                        deleteAddress(
                          address
                        )
                      }
                    >
                      <Text
                        style={
                          styles.deleteText
                        }
                      >
                        🗑 Delete
                      </Text>
                    </TouchableOpacity>

                  </View>

                </View>

              )
            )}
          </>

        )}

        <View
          style={{
            height: 35,
          }}
        />

      </ScrollView>

      {/* =================================================
          ADD / EDIT MODAL
      ================================================= */}

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={
          closeForm
        }
      >

        <KeyboardAvoidingView
          style={
            styles.modalKeyboardContainer
          }
          behavior={
            Platform.OS === 'ios'
              ? 'padding'
              : 'height'
          }
        >

          <View
            style={
              styles.modalOverlay
            }
          >

            <View
              style={
                styles.modalContainer
              }
            >

              {/* MODAL HEADER */}

              <View
                style={
                  styles.modalHeader
                }
              >

                <Text
                  style={
                    styles.modalTitle
                  }
                >
                  {editingAddress
                    ? 'Edit Address'
                    : 'Add New Address'}
                </Text>

                <TouchableOpacity
                  onPress={
                    closeForm
                  }
                  disabled={saving}
                >
                  <Text
                    style={
                      styles.closeText
                    }
                  >
                    ×
                  </Text>
                </TouchableOpacity>

              </View>

              {/* FORM SCROLL */}

              <ScrollView
                style={
                  styles.modalScroll
                }
                contentContainerStyle={
                  styles.modalScrollContent
                }
                showsVerticalScrollIndicator={
                  false
                }
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="on-drag"
              >

                {/* FULL NAME */}

                <Text
                  style={
                    styles.inputLabel
                  }
                >
                  Full Name
                </Text>

                <TextInput
                  style={
                    styles.input
                  }
                  placeholder="Enter full name"
                  placeholderTextColor="#999"
                  value={
                    form.full_name
                  }
                  onChangeText={(
                    value
                  ) =>
                    updateField(
                      'full_name',
                      value
                    )
                  }
                  editable={!saving}
                />

                {/* PHONE */}

                <Text
                  style={
                    styles.inputLabel
                  }
                >
                  Phone Number
                </Text>

                <TextInput
                  style={
                    styles.input
                  }
                  placeholder="Enter 10-digit phone number"
                  placeholderTextColor="#999"
                  value={
                    form.phone
                  }
                  onChangeText={(
                    value
                  ) =>
                    updateField(
                      'phone',
                      value.replace(
                        /\D/g,
                        ''
                      )
                    )
                  }
                  keyboardType="phone-pad"
                  maxLength={10}
                  editable={!saving}
                />

                {/* ADDRESS */}

                <Text
                  style={
                    styles.inputLabel
                  }
                >
                  Address
                </Text>

                <TextInput
                  style={[
                    styles.input,
                    styles.multilineInput,
                  ]}
                  placeholder="House no, street, area"
                  placeholderTextColor="#999"
                  value={
                    form.address_line
                  }
                  onChangeText={(
                    value
                  ) =>
                    updateField(
                      'address_line',
                      value
                    )
                  }
                  multiline
                  editable={!saving}
                />

                {/* CITY */}

                <Text
                  style={
                    styles.inputLabel
                  }
                >
                  City
                </Text>

                <TextInput
                  style={
                    styles.input
                  }
                  placeholder="Enter city"
                  placeholderTextColor="#999"
                  value={
                    form.city
                  }
                  onChangeText={(
                    value
                  ) =>
                    updateField(
                      'city',
                      value
                    )
                  }
                  editable={!saving}
                />

                {/* STATE */}

                <Text
                  style={
                    styles.inputLabel
                  }
                >
                  State
                </Text>

                <TextInput
                  style={
                    styles.input
                  }
                  placeholder="Enter state"
                  placeholderTextColor="#999"
                  value={
                    form.state
                  }
                  onChangeText={(
                    value
                  ) =>
                    updateField(
                      'state',
                      value
                    )
                  }
                  editable={!saving}
                />

                {/* PINCODE */}

                <Text
                  style={
                    styles.inputLabel
                  }
                >
                  Pincode
                </Text>

                <TextInput
                  style={
                    styles.input
                  }
                  placeholder="Enter 6-digit pincode"
                  placeholderTextColor="#999"
                  value={
                    form.pincode
                  }
                  onChangeText={(
                    value
                  ) =>
                    updateField(
                      'pincode',
                      value.replace(
                        /\D/g,
                        ''
                      )
                    )
                  }
                  keyboardType="number-pad"
                  maxLength={6}
                  editable={!saving}
                />

                {/* SAVE */}

                <TouchableOpacity
                  style={[
                    styles.saveButton,
                    saving &&
                      styles.disabledButton,
                  ]}
                  onPress={
                    saveAddress
                  }
                  disabled={saving}
                  activeOpacity={0.8}
                >

                  {saving ? (

                    <ActivityIndicator
                      color="#fff"
                    />

                  ) : (

                    <Text
                      style={
                        styles.saveButtonText
                      }
                    >
                      {editingAddress
                        ? 'Update Address'
                        : 'Save Address'}
                    </Text>

                  )}

                </TouchableOpacity>

                {/* KEYBOARD EXTRA SPACE */}

                <View
                  style={{
                    height: 100,
                  }}
                />

              </ScrollView>

            </View>

          </View>

        </KeyboardAvoidingView>

      </Modal>

    </View>
  );
}

// =====================================================
// STYLES
// =====================================================

const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },

  loadingContainer: {
    flex: 1,
    backgroundColor: '#f8f8f8',
    justifyContent: 'center',
    alignItems: 'center',
  },

  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#777',
  },

  // ===================================================
  // HEADER
  // ===================================================

  header: {
    paddingTop: 50,
    paddingHorizontal: 16,
    paddingBottom: 15,
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#f2f2f2',
    alignItems: 'center',
    justifyContent: 'center',
  },

  backText: {
    fontSize: 32,
    color: '#222',
    marginTop: -4,
  },

  title: {
    fontSize: 19,
    fontWeight: '800',
    color: '#181818',
  },

  addHeaderButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#7c3aed',
    alignItems: 'center',
    justifyContent: 'center',
  },

  addHeaderText: {
    color: '#ffffff',
    fontSize: 28,
    fontWeight: '700',
    marginTop: -2,
  },

  // ===================================================
  // CONTENT
  // ===================================================

  content: {
    padding: 14,
    paddingBottom: 40,
  },

  infoBox: {
    backgroundColor: '#f5f3ff',
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },

  infoIcon: {
    fontSize: 28,
  },

  infoContent: {
    flex: 1,
    marginLeft: 12,
  },

  infoTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#181818',
  },

  infoText: {
    marginTop: 4,
    fontSize: 12,
    lineHeight: 18,
    color: '#666',
  },

  addButton: {
    width: '100%',
    height: 50,
    borderRadius: 12,
    backgroundColor: '#7c3aed',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 18,
  },

  addButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
  },

  countText: {
    fontSize: 14,
    color: '#777',
    marginBottom: 12,
  },

  // ===================================================
  // ADDRESS CARD
  // ===================================================

  addressCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },

  addressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  locationCircle: {
    width: 45,
    height: 45,
    borderRadius: 23,
    backgroundColor: '#f3e8ff',
    alignItems: 'center',
    justifyContent: 'center',
  },

  locationIcon: {
    fontSize: 21,
  },

  headerInfo: {
    flex: 1,
    marginLeft: 12,
  },

  name: {
    fontSize: 16,
    fontWeight: '800',
    color: '#181818',
  },

  phone: {
    marginTop: 3,
    fontSize: 13,
    color: '#777',
  },

  addressLine: {
    marginTop: 16,
    fontSize: 14,
    lineHeight: 21,
    color: '#333',
  },

  cityLine: {
    marginTop: 5,
    fontSize: 14,
    color: '#444',
  },

  pincode: {
    marginTop: 4,
    fontSize: 13,
    color: '#777',
  },

  actionsRow: {
    flexDirection: 'row',
    marginTop: 15,
    gap: 10,
  },

  editButton: {
    flex: 1,
    height: 42,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#7c3aed',
    justifyContent: 'center',
    alignItems: 'center',
  },

  editText: {
    color: '#7c3aed',
    fontSize: 13,
    fontWeight: '800',
  },

  deleteButton: {
    flex: 1,
    height: 42,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ef4444',
    justifyContent: 'center',
    alignItems: 'center',
  },

  deleteText: {
    color: '#dc2626',
    fontSize: 13,
    fontWeight: '800',
  },

  // ===================================================
  // EMPTY
  // ===================================================

  emptyContainer: {
    marginTop: 70,
    alignItems: 'center',
    paddingHorizontal: 30,
  },

  emptyIcon: {
    fontSize: 55,
    marginBottom: 15,
  },

  emptyTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#181818',
    textAlign: 'center',
  },

  emptyText: {
    marginTop: 9,
    fontSize: 14,
    lineHeight: 21,
    color: '#777',
    textAlign: 'center',
  },

  shopButton: {
    marginTop: 24,
    paddingHorizontal: 25,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: '#7c3aed',
  },

  shopButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
  },

  // ===================================================
  // MODAL KEYBOARD
  // ===================================================

  modalKeyboardContainer: {
    flex: 1,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor:
      'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },

 modalContainer: {
  backgroundColor: '#ffffff',
  borderTopLeftRadius: 24,
  borderTopRightRadius: 24,
  paddingHorizontal: 20,
  paddingTop: 18,
  height: '85%',
  maxHeight: '92%',
},

  modalScroll: {
    flex: 1,
  },

  modalScrollContent: {
    paddingBottom: 30,
  },

  // ===================================================
  // MODAL HEADER
  // ===================================================

  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },

  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#181818',
  },

  closeText: {
    fontSize: 32,
    color: '#555',
    lineHeight: 32,
  },

  // ===================================================
  // INPUTS
  // ===================================================

  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#333',
    marginBottom: 6,
    marginTop: 10,
  },

  input: {
    width: '100%',
    minHeight: 48,
    borderWidth: 1,
    borderColor: '#dddddd',
    borderRadius: 10,
    paddingHorizontal: 13,
    fontSize: 14,
    color: '#222',
    backgroundColor: '#fafafa',
  },

  multilineInput: {
    minHeight: 80,
    paddingTop: 12,
    textAlignVertical: 'top',
  },

  // ===================================================
  // SAVE BUTTON
  // ===================================================

  saveButton: {
    width: '100%',
    height: 52,
    borderRadius: 12,
    backgroundColor: '#7c3aed',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 22,
  },

  disabledButton: {
    opacity: 0.6,
  },

  saveButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
  },

});