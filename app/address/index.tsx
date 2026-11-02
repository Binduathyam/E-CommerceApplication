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

// =====================================================
// TYPES
// =====================================================

type Address = {
  id: number;
  user_id?: number;
  full_name: string;
  phone: string;
  address_line: string;
  city: string;
  state: string;
  pincode: string;
  is_default?: boolean | number;
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

// =====================================================
// SCREEN
// =====================================================

export default function AddressScreen() {
  const router = useRouter();

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);

  const [modalVisible, setModalVisible] = useState(false);
  const [saving, setSaving] = useState(false);

  const [editingAddress, setEditingAddress] =
    useState<Address | null>(null);

  const [defaultLoading, setDefaultLoading] =
    useState<number | null>(null);

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
  // CHECK DEFAULT ADDRESS
  // =====================================================

  const isDefaultAddress = (
    address: Address
  ): boolean => {
    return (
      address.is_default === true ||
      Number(address.is_default) === 1
    );
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
  // SORT DEFAULT ADDRESS FIRST
  // =====================================================

  const sortAddresses = (
    addressList: Address[]
  ): Address[] => {
    return [...addressList].sort(
      (a, b) =>
        Number(isDefaultAddress(b)) -
        Number(isDefaultAddress(a))
    );
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

      if (!response.ok || !data?.success) {
        throw new Error(
          data?.message ||
            'Failed to fetch addresses'
        );
      }

      const addressList =
        Array.isArray(data?.addresses)
          ? data.addresses
          : [];

      // Remove duplicates
      const uniqueAddresses =
        removeDuplicateAddresses(
          addressList
        );

      // Default address first
      const sortedAddresses =
        sortAddresses(
          uniqueAddresses
        );

      setAddresses(sortedAddresses);
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
        // Don't compare address with itself
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

      // Check duplicate
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
      // UPDATE ADDRESS
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
      // ADD ADDRESS
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
              JSON.stringify({
                ...payload,

                // First address becomes default
                is_default:
                  addresses.length === 0,
              }),
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

      const wasEditing =
        Boolean(editingAddress);

      setModalVisible(false);

      setEditingAddress(null);

      setForm({
        ...emptyForm,
      });

      await loadAddresses();

      Alert.alert(
        'Success',
        wasEditing
          ? 'Address updated successfully.'
          : addresses.length === 0
          ? 'Address added as your default address.'
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
  // SET DEFAULT ADDRESS
  // =====================================================

  const setDefaultAddress = async (
    addressId: number
  ) => {
    try {
      const userId =
        await getUserId();

      if (!userId) {
        Alert.alert(
          'Login Required',
          'Please login again to manage your addresses.'
        );

        return;
      }

      setDefaultLoading(addressId);

      const response =
        await fetch(
          `${API_BASE_URL}/api/addresses/${addressId}/default`,
          {
            method: 'PUT',

            headers: {
              'Content-Type':
                'application/json',
            },

            body:
              JSON.stringify({
                user_id: userId,
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
            'Failed to set default address'
        );
      }

      await loadAddresses();

      Alert.alert(
        'Success',
        'Default address updated successfully.'
      );
    } catch (error) {
      console.error(
        'Set default address error:',
        error
      );

      Alert.alert(
        'Error',
        error instanceof Error
          ? error.message
          : 'Unable to set default address.'
      );
    } finally {
      setDefaultLoading(null);
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
                Alert.alert(
                  'Login Required',
                  'Please login again.'
                );

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
          Loading your addresses...
        </Text>
      </View>
    );
  }

  // =====================================================
  // SCREEN
  // =====================================================

  return (
    <View
      style={styles.container}
    >
      {/* =================================================
          HEADER
      ================================================= */}

      <View
        style={styles.header}
      >
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

        <View
          style={
            styles.headerTitleContainer
          }
        >
          <Text
            style={
              styles.headerSmallTitle
            }
          >
            ACCOUNT
          </Text>

          <Text
            style={styles.title}
          >
            My Addresses
          </Text>
        </View>

        <TouchableOpacity
          style={
            styles.addHeaderButton
          }
          onPress={
            openAddForm
          }
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

      {/* =================================================
          CONTENT
      ================================================= */}

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
              addresses for faster
              checkout.
            </Text>
          </View>
        </View>

        {/* ADD BUTTON */}

        <TouchableOpacity
          style={
            styles.addButton
          }
          onPress={
            openAddForm
          }
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

        {/* =================================================
            EMPTY STATE
        ================================================= */}

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
              🏠
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
              Add your first delivery
              address to make checkout
              faster.
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
            {/* COUNT */}

            <View
              style={
                styles.sectionHeading
              }
            >
              <View>
                <Text
                  style={
                    styles.sectionTitle
                  }
                >
                  Saved Addresses
                </Text>

                <Text
                  style={
                    styles.countText
                  }
                >
                  {addresses.length}{' '}
                  {addresses.length ===
                  1
                    ? 'address'
                    : 'addresses'}{' '}
                  saved
                </Text>
              </View>
            </View>

            {/* =================================================
                ADDRESS LIST
            ================================================= */}

            {addresses.map(
              (address) => {
                const isDefault =
                  isDefaultAddress(
                    address
                  );

                return (
                  <View
                    key={
                      address.id
                    }
                    style={[
                      styles.addressCard,
                      isDefault &&
                        styles.defaultAddressCard,
                    ]}
                  >
                    {/* CARD TOP */}

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
                          🏠
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
                          {
                            address.full_name
                          }
                        </Text>

                        <Text
                          style={
                            styles.phone
                          }
                        >
                          ☎{' '}
                          {
                            address.phone
                          }
                        </Text>
                      </View>

                      {/* DEFAULT BADGE */}

                      {isDefault && (
                        <View
                          style={
                            styles.defaultBadge
                          }
                        >
                          <Text
                            style={
                              styles.defaultBadgeText
                            }
                          >
                            ⭐ Default
                          </Text>
                        </View>
                      )}
                    </View>

                    {/* ADDRESS */}

                    <View
                      style={
                        styles.addressContent
                      }
                    >
                      <Text
                        style={
                          styles.addressLocationIcon
                        }
                      >
                        📍
                      </Text>

                      <Text
                        style={
                          styles.addressLine
                        }
                      >
                        {
                          address.address_line
                        }
                      </Text>
                    </View>

                    {/* CITY / STATE / PIN */}

                    <View
                      style={
                        styles.addressTags
                      }
                    >
                      <View
                        style={
                          styles.addressTag
                        }
                      >
                        <Text
                          style={
                            styles.addressTagText
                          }
                        >
                          🏙{' '}
                          {
                            address.city
                          }
                        </Text>
                      </View>

                      <View
                        style={
                          styles.addressTag
                        }
                      >
                        <Text
                          style={
                            styles.addressTagText
                          }
                        >
                          🗺{' '}
                          {
                            address.state
                          }
                        </Text>
                      </View>

                      <View
                        style={
                          styles.addressTag
                        }
                      >
                        <Text
                          style={
                            styles.addressTagText
                          }
                        >
                          📌{' '}
                          {
                            address.pincode
                          }
                        </Text>
                      </View>
                    </View>

                    {/* DEFAULT MESSAGE */}

                    {isDefault && (
                      <View
                        style={
                          styles.defaultMessage
                        }
                      >
                        <Text
                          style={
                            styles.defaultCheck
                          }
                        >
                          ✓
                        </Text>

                        <Text
                          style={
                            styles.defaultMessageText
                          }
                        >
                          This is your
                          default delivery
                          address.
                        </Text>
                      </View>
                    )}

                    {/* ACTIONS */}

                    <View
                      style={
                        styles.actionsRow
                      }
                    >
                      {/* EDIT */}

                      <TouchableOpacity
                        style={
                          styles.editButton
                        }
                        onPress={() =>
                          openEditForm(
                            address
                          )
                        }
                        disabled={
                          saving
                        }
                      >
                        <Text
                          style={
                            styles.editText
                          }
                        >
                          ✏ Edit
                        </Text>
                      </TouchableOpacity>

                      {/* DELETE */}

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

                    {/* SET DEFAULT */}

                    {!isDefault && (
                      <TouchableOpacity
                        style={
                          styles.setDefaultButton
                        }
                        onPress={() =>
                          setDefaultAddress(
                            address.id
                          )
                        }
                        disabled={
                          defaultLoading ===
                          address.id
                        }
                        activeOpacity={
                          0.8
                        }
                      >
                        {defaultLoading ===
                        address.id ? (
                          <ActivityIndicator
                            size="small"
                            color="#7c3aed"
                          />
                        ) : (
                          <Text
                            style={
                              styles.setDefaultText
                            }
                          >
                            ☆ Set as Default
                          </Text>
                        )}
                      </TouchableOpacity>
                    )}
                  </View>
                );
              }
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
        visible={
          modalVisible
        }
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
            Platform.OS ===
            'ios'
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
                <View>
                  <Text
                    style={
                      styles.modalSmallTitle
                    }
                  >
                    ADDRESS
                  </Text>

                  <Text
                    style={
                      styles.modalTitle
                    }
                  >
                    {editingAddress
                      ? 'Edit Address'
                      : 'New Address'}
                  </Text>
                </View>

                <TouchableOpacity
                  onPress={
                    closeForm
                  }
                  disabled={
                    saving
                  }
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

              {/* FORM */}

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
                  <Text
                    style={
                      styles.required
                    }
                  >
                    {' '}*
                  </Text>
                </Text>

                <TextInput
                  style={
                    styles.input
                  }
                  placeholder="Enter your full name"
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
                  editable={
                    !saving
                  }
                />

                {/* PHONE */}

                <Text
                  style={
                    styles.inputLabel
                  }
                >
                  Phone Number
                  <Text
                    style={
                      styles.required
                    }
                  >
                    {' '}*
                  </Text>
                </Text>

                <TextInput
                  style={
                    styles.input
                  }
                  placeholder="10-digit mobile number"
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
                  editable={
                    !saving
                  }
                />

                {/* ADDRESS */}

                <Text
                  style={
                    styles.inputLabel
                  }
                >
                  Address
                  <Text
                    style={
                      styles.required
                    }
                  >
                    {' '}*
                  </Text>
                </Text>

                <TextInput
                  style={[
                    styles.input,
                    styles.multilineInput,
                  ]}
                  placeholder="House No, Street, Area, Landmark"
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
                  editable={
                    !saving
                  }
                />

                {/* CITY */}

                <Text
                  style={
                    styles.inputLabel
                  }
                >
                  City
                  <Text
                    style={
                      styles.required
                    }
                  >
                    {' '}*
                  </Text>
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
                  editable={
                    !saving
                  }
                />

                {/* STATE */}

                <Text
                  style={
                    styles.inputLabel
                  }
                >
                  State
                  <Text
                    style={
                      styles.required
                    }
                  >
                    {' '}*
                  </Text>
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
                  editable={
                    !saving
                  }
                />

                {/* PINCODE */}

                <Text
                  style={
                    styles.inputLabel
                  }
                >
                  PIN Code
                  <Text
                    style={
                      styles.required
                    }
                  >
                    {' '}*
                  </Text>
                </Text>

                <TextInput
                  style={
                    styles.input
                  }
                  placeholder="6-digit PIN code"
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
                  editable={
                    !saving
                  }
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
                  disabled={
                    saving
                  }
                  activeOpacity={
                    0.8
                  }
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
                        : '💾 Save Address'}
                    </Text>
                  )}
                </TouchableOpacity>

                {/* NOTE */}

                {!editingAddress && (
                  <Text
                    style={
                      styles.formNote
                    }
                  >
                    Your first saved address
                    will automatically become
                    your default address.
                  </Text>
                )}

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
  // ===================================================
  // MAIN
  // ===================================================

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

  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },

  headerSmallTitle: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.5,
    color: '#7c3aed',
    marginBottom: 2,
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
    marginBottom: 20,
  },

  addButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
  },

  sectionHeading: {
    marginBottom: 12,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#181818',
  },

  countText: {
    marginTop: 4,
    fontSize: 13,
    color: '#777',
  },

  // ===================================================
  // ADDRESS CARD
  // ===================================================

  addressCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,

    borderWidth: 1,
    borderColor: '#eeeeee',

    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 5,

    elevation: 2,
  },

  defaultAddressCard: {
    borderColor: '#c4b5fd',
    borderWidth: 1.5,
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

  // ===================================================
  // DEFAULT BADGE
  // ===================================================

  defaultBadge: {
    backgroundColor: '#ede9fe',
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 8,
    marginLeft: 8,
  },

  defaultBadgeText: {
    color: '#6d28d9',
    fontSize: 11,
    fontWeight: '800',
  },

  // ===================================================
  // ADDRESS CONTENT
  // ===================================================

  addressContent: {
    flexDirection: 'row',
    marginTop: 16,
  },

  addressLocationIcon: {
    fontSize: 17,
    marginRight: 7,
    marginTop: 1,
  },

  addressLine: {
    flex: 1,
    fontSize: 14,
    lineHeight: 21,
    color: '#333',
  },

  // ===================================================
  // ADDRESS TAGS
  // ===================================================

  addressTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
    gap: 7,
  },

  addressTag: {
    backgroundColor: '#f7f7f7',
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 8,
  },

  addressTagText: {
    fontSize: 11,
    color: '#555',
    fontWeight: '600',
  },

  // ===================================================
  // DEFAULT MESSAGE
  // ===================================================

  defaultMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f3ff',
    borderRadius: 9,
    paddingHorizontal: 10,
    paddingVertical: 9,
    marginTop: 13,
  },

  defaultCheck: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#7c3aed',
    color: '#ffffff',
    textAlign: 'center',
    lineHeight: 20,
    fontSize: 12,
    fontWeight: '800',
    marginRight: 8,
  },

  defaultMessageText: {
    flex: 1,
    fontSize: 12,
    color: '#5b21b6',
    fontWeight: '600',
  },

  // ===================================================
  // ACTIONS
  // ===================================================

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
  // SET DEFAULT
  // ===================================================

  setDefaultButton: {
    width: '100%',
    height: 42,
    borderRadius: 10,
    backgroundColor: '#f5f3ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#ddd6fe',
  },

  setDefaultText: {
    color: '#7c3aed',
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
  // MODAL
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

  modalSmallTitle: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.5,
    color: '#7c3aed',
    marginBottom: 2,
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

  required: {
    color: '#ef4444',
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

  // ===================================================
  // FORM NOTE
  // ===================================================

  formNote: {
    marginTop: 12,
    fontSize: 11,
    lineHeight: 17,
    color: '#777',
    textAlign: 'center',
    paddingHorizontal: 15,
  },
});